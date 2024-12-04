import clipboardy from 'clipboardy';
import fs from 'fs';
import path from 'path';
import { Builder, By, until } from 'selenium-webdriver';

const SAVE_FOLDER = './songs';
const FILE_PREFIX = 'Clipboard_';
const SONGSELECT_URL = 'https://songselect.ccli.com/';

async function initializeDriver() {
  const driver = new Builder().forBrowser('chrome').build();
  return driver;
}

function extractTitle(content) {
  const match = content.trim().match(/^[^\r\n]+/);
  return match ? match[0].trim() : null;
}

function saveClipboardContent(content) {
  if (!fs.existsSync(SAVE_FOLDER)) {
    fs.mkdirSync(SAVE_FOLDER);
  }

  let title = extractTitle(content);
  if (!title) {
    title = `${FILE_PREFIX}${new Date().toISOString().replace(/[:.-]/g, '_')}`;
  }

  const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_');
  const filePath = path.join(SAVE_FOLDER, `${sanitizedTitle}.txt`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Clipboard content saved to ${filePath}`);
}

async function monitorClipboard() {
  console.log('Monitoring clipboard for changes. Press Ctrl+C to stop.');
  let lastContent = await clipboardy.read();

  while (true) {
    try {
      const currentContent = await clipboardy.read();
      if (currentContent !== lastContent) {
        console.log('New clipboard content detected!');
        saveClipboardContent(currentContent);
        lastContent = currentContent;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
    }
  }
}

async function main() {
  let driver;
  try {
    driver = await initializeDriver();
    await driver.get(SONGSELECT_URL);
    console.log(`Launched browser to ${SONGSELECT_URL}`);

    try {
      const signInButton = await driver.wait(
        until.elementLocated(By.id('ProfileNavSignInLink')),
        10000
      );
      await signInButton.click();
      console.log("Clicked the 'Sign In' button.");
    } catch (error) {
      console.error("Failed to find or click the 'Sign In' button:", error.message);
    }

    await monitorClipboard();
  } catch (error) {
    console.error('An error occurred:', error.message);
  } finally {
    if (driver) {
      await driver.quit();
      console.log('Browser closed.');
    }
  }
}

main();