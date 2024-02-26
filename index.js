const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function scrapeProduct(url, region) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 926 }); // Установите размеры окна в соответствии с вашими требованиями

    await page.goto(url);

    await page.waitForSelector(".Tooltip_closeIcon__skwl0");
    await page.click(".Tooltip_closeIcon__skwl0");

    await page.waitForSelector(".Region_region__6OUBn");
    // await wait(5000);

    await page.click(".Region_region__6OUBn");

    await page.waitForSelector(".UiRegionListBase_list__cH0fK");
    const regionName = region;
    console.log("regionName: ", regionName);

    const regionData = await page.evaluate((regionName) => {
        const regions = Array.from(
            document.querySelectorAll(".UiRegionListBase_item___ly_A")
        );
        const targetRegion = regions.find(
            (region) => region.innerText.trim() === regionName
        );
        if (targetRegion) targetRegion.click();

        return regions.map((element) => element.innerText.trim());
    }, regionName);

    console.log(regionData);

    await page.screenshot({ path: "screenshot.jpg", fullPage: true });

    // Извлечение данных о товаре
    const productData = await page.evaluate(() => {
        let rating = document.querySelector(".Rating_value__S2QNR").innerText;
        let reviewCount = document
            .querySelector(".ActionsRow_button__g8vnK")
            .innerText.replace(/[^\d]/g, "");
        return { rating, reviewCount };
    });
    console.log("rating: ", productData.rating);
    console.log("reviewCount: ", productData.reviewCount);
    console.log("productData: ", productData);

    // await wait(100000);

    const priceInfo = await page.evaluate(() => {
        const productInfoContainer = document.querySelector(
            ".ProductPage_informationBlock__vDYCH"
        );
        const priceElement = productInfoContainer.querySelector(
            ".Price_role_discount__l_tpE"
        );
        const price = priceElement
            ? priceElement.innerText
                  .trim()
                  .replace(/[^\d,.]/g, "")
                  .replace(",", ".")
            : null;
        const oldPriceElement = productInfoContainer.querySelector(
            ".Price_role_old__r1uT1"
        );
        const oldPrice = oldPriceElement
            ? oldPriceElement.innerText
                  .trim()
                  .replace(/[^\d,.]/g, "")
                  .replace(",", ".")
            : null;
        return { price, oldPrice };
    });
    console.log("price: ", priceInfo.price);
    console.log("oldPrice: ", priceInfo.oldPrice);
    console.log("priceInfo: ", priceInfo);

    await fs.writeFile(
        "product.txt",
        `price=${priceInfo.price}\npriceOld=${priceInfo.oldPrice}\nrating=${productData.rating}\nreviewCount=${productData.reviewCount}`
    );

    await browser.close();
}

const [, , productUrl, region] = process.argv;
scrapeProduct(productUrl, region);

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
