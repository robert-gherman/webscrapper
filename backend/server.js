const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
const { firefox } = require("playwright");
const fs = require("fs");

app.get("/scraped-data", async (req, res) => {
  function fetchWordList(filePath) {
    return fs
      .readFileSync(filePath, "utf8")
      .split("\n")
      .map((word) => word.trim());
  }
  (async () => {
    const browserTypes = ["firefox"];
    const scrapedData = [];
    const positiveWords = fetchWordList("./positive-words.txt");
    const negativeWords = fetchWordList("./bad-words.txt");

    const browser = await { firefox }[browserTypes].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://wsa-test.vercel.app/");
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const groupDivs = document.querySelectorAll("div.group");
      const bigDivs = document.querySelectorAll(
        "div > main > div > div > div:nth-child(2) > div"
      );
      const dataArray = [];

      groupDivs.forEach((groupDiv, index) => {
        const titleElement = groupDiv
          .querySelector("div:first-child")
          .textContent.trim();
        const shortDescriptionElement = groupDiv
          .querySelector("div:nth-child(2)")
          .textContent.trim();
        const imageElement = bigDivs[index].querySelector("img").src;
        const hrefElement = groupDiv.querySelector("a").getAttribute("href");
        dataArray.push({
          title: titleElement,
          image: imageElement,
          short_description: shortDescriptionElement,
          href: hrefElement,
        });
      });

      return dataArray;
    });
    function analyzeSentiment(text, positiveWords, negativeWords) {
      const words = text.toLowerCase().split(/\s+/);
      const positiveMatches = words.filter((word) =>
        positiveWords.includes(word)
      );
      const negativeMatches = words.filter((word) =>
        negativeWords.includes(word)
      );

      if (positiveMatches.length > negativeMatches.length) {
        return "positive";
      } else if (negativeMatches.length > positiveMatches.length) {
        return "negative";
      } else {
        return "neutral";
      }
    }
    for (const post of data) {
      const postPage = await context.newPage();
      await postPage.goto(`https://wsa-test.vercel.app${post.href}`);
      await postPage.waitForSelector(
        "div div div div div:nth-child(2) div div:nth-child(3)"
      );

      const content = await postPage.evaluate(() => {
        const contentElement = document.querySelector(
          "div div div div div:nth-child(2) div div:nth-child(3)"
        );

        return contentElement ? contentElement.textContent.trim() : null;
      });
      const sentiment = analyzeSentiment(content, positiveWords, negativeWords);
      const words = content.split(/\s+/).length;
      postPage.close();
      scrapedData.push({ ...post, content, sentiment, words });
    }

    await browser.close();

    res.json(scrapedData);
  })();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
