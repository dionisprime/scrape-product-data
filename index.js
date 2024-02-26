const puppeteer = require("puppeteer");
const fs = require("fs").promises;

async function scrapeProduct(url, region) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 926 });

    await page.goto(url);

    await page.waitForSelector(".Tooltip_closeIcon__skwl0");
    await page.click(".Tooltip_closeIcon__skwl0");

    await page.waitForSelector(".Region_region__6OUBn");

    await page.click(".Region_region__6OUBn");

    await page.waitForSelector(".UiRegionListBase_list__cH0fK");
    const regionName = region;

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

    await page.screenshot({ path: "screenshot.jpg", fullPage: true });

    const productData = await page.evaluate(() => {
        let rating = document.querySelector(".Rating_value__S2QNR").innerText;
        let reviewCount = document
            .querySelector(".ActionsRow_button__g8vnK")
            .innerText.replace(/[^\d]/g, "");
        return { rating, reviewCount };
    });

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

    await fs.writeFile(
        "product.txt",
        `price=${priceInfo.price}\npriceOld=${priceInfo.oldPrice}\nrating=${productData.rating}\nreviewCount=${productData.reviewCount}`
    );

    await browser.close();
}

const [, , productUrl, region] = process.argv;
scrapeProduct(productUrl, region);
