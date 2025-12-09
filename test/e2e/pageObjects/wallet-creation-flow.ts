import { $, driver } from '@wdio/globals';

export class WalletCreationFlow {
  /**
   * Gets the Create Wallet button from onboarding screen
   */
  getCreateWalletButton() {
    return $('~Create Wallet');
  }

  /**
   * Gets the wallet name input field
   */
  getWalletNameInput() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeTextField')
      : $('android=new UiSelector().className("android.widget.EditText")');
  }

  /**
   * Gets the first avatar element (Bitcoin logo with content-desc="B")
   */
  getFirstAvatar() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    if (isIOS) {
      // Try predicate string first (name == "B" AND label == "B")
      // This matches what Appium Inspector showed
      return $('-ios predicate string:name == "₿" AND label == "₿" AND type == "XCUIElementTypeOther"');
    }
    return $('~B'); // Using accessibility ID/content-desc for Android
  }

  /**
   * Gets the Next button (generic - works for multiple screens)
   */
  getNextButton() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    // Next button is XCUIElementTypeOther, not XCUIElementTypeButton
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeOther[`name == "Next"`]')
      : $('android=new UiSelector().text("Next")');
  }

  /**
   * Gets the Next button specifically for the Secure Your Wallet page
   */
  getSecureWalletPageNextButton() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeOther[`name == "Next"`]')
      : $('~Next'); // Using accessibility ID/content-desc
  }

  /**
   * Gets the Copy Phrase button
   */
  getCopyPhraseButton() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeOther[`name == "Copy Phrase"`]')
      : $('~Copy Phrase'); // Using accessibility ID/content-desc
  }

  /**
   * Extracts all mnemonic phrase words from the Secure Your Wallet screen
   * Returns an array of 12 words in order
   */
  async getMnemonicWords(): Promise<string[]> {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    const words: string[] = [];

    if (isIOS) {
      // For iOS, find all static text elements that are likely mnemonic words
      // The words are displayed as XCUIElementTypeStaticText elements
      // We'll get all static texts and filter for valid mnemonic words
      const allTextElements = await driver.$$('-ios class chain:**/XCUIElementTypeStaticText');
      
      for (const element of allTextElements) {
        try {
          const text = await element.getText();
          // Mnemonic words are typically lowercase, 3-8 characters, and not numbers or special text
          if (text && text.length >= 3 && text.length <= 8 && /^[a-z]+$/.test(text.trim())) {
            // Exclude common UI text that might match
            const excludedWords = ['back', 'next', 'copy', 'phrase', 'hide', 'show', 'secure', 'wallet', 'your', 'this', 'secret', 'only', 'way', 'recover', 'store', 'safely', 'never', 'share', 'anyone', 'with', 'can', 'access'];
            if (!excludedWords.includes(text.trim().toLowerCase())) {
              words.push(text.trim());
            }
          }
        } catch (e) {
          // Skip elements that can't be read
          continue;
        }
      }
    } else {
      // For Android, find all TextView elements that contain mnemonic words
      // The words are displayed as TextView elements
      const allTextElements = await driver.$$('android=new UiSelector().className("android.widget.TextView")');
      
      for (const element of allTextElements) {
        try {
          const text = await element.getText();
          // Mnemonic words are typically lowercase, 3-8 characters, and not numbers or special text
          if (text && text.length >= 3 && text.length <= 8 && /^[a-z]+$/.test(text.trim())) {
            // Exclude common UI text that might match
            const excludedWords = ['back', 'next', 'copy', 'phrase', 'hide', 'show', 'secure', 'wallet', 'your', 'this', 'secret', 'only', 'way', 'recover', 'store', 'safely', 'never', 'share', 'anyone', 'with', 'can', 'access'];
            if (!excludedWords.includes(text.trim().toLowerCase())) {
              words.push(text.trim());
            }
          }
        } catch (e) {
          // Skip elements that can't be read
          continue;
        }
      }
    }

    // Return first 12 words (mnemonic phrases are typically 12 words)
    return words.slice(0, 12);
  }

  /**
   * Gets the "Go To Wallet" button from complete screen
   */
  getGoToWalletButton() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $('~Go To Wallet') // Using accessibility ID for iOS
      : $('~Go To Wallet'); // Using accessibility ID/content-desc for Android
  }

  /**
   * Waits for the wallet creation loading screen to complete
   * This waits for the "You're All Set!" screen to appear
   */
  async waitForWalletCreationToComplete(timeout: number = 90000) {
    // Wait for the "Go To Wallet" button to appear, which indicates wallet creation is complete
    // This is more reliable than waiting for a title text
    // Wallet creation is not instant and can take 30-60 seconds
    const goToWalletButton = this.getGoToWalletButton();
    
    console.log(`[Wallet Creation] Waiting up to ${timeout / 1000}s for wallet creation to complete...`);
    
    try {
      await goToWalletButton.waitForDisplayed({ timeout });
      console.log('[Wallet Creation] Wallet creation completed successfully');
      await driver.pause(1000); // Small pause to ensure screen is fully loaded
    } catch (e) {
      // If button not found, try waiting for the title as fallback
      console.log('[Wallet Creation] "Go To Wallet" button not found, trying to find "You\'re All Set!" title...');
      const isIOS = (driver as any).capabilities.platformName === 'iOS';
      const allSetTitle = isIOS
        ? $('~You\'re All Set!')
        : $('android=new UiSelector().text("You\'re All Set!")');
      
      try {
        await allSetTitle.waitForDisplayed({ timeout: 10000 });
        console.log('[Wallet Creation] Found "You\'re All Set!" title');
        await driver.pause(1000);
      } catch (e2) {
        throw new Error(`Could not find "Go To Wallet" button or "You're All Set!" title after ${timeout}ms`);
      }
    }
  }

  /**
   * Gets word option buttons in confirm phrase screen
   * @param wordText The word text to find
   */
  getWordOptionButton(wordText: string) {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $(`-ios class chain:**/XCUIElementTypeButton[\`name == "${wordText}" OR label == "${wordText}"\`]`)
      : $(`android=new UiSelector().text("${wordText}")`);
  }

  /**
   * Gets all word option buttons for a specific word position
   * This finds all word buttons that could be options for a given position
   * @param wordPosition The word position number (e.g., 3, 5, 7, 12)
   */
  async getWordOptionsForPosition(wordPosition: number) {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    
    if (isIOS) {
      // For iOS, find all buttons that are word options
      // These are typically within the same container as the "Word #X" label
      return await driver.$$(`-ios class chain:**/XCUIElementTypeButton`);
    } else {
      // For Android, find all TextView elements that are clickable word options
      // We'll filter these to get only the ones that are actual word buttons
      const allTextViews = await driver.$$('android=new UiSelector().className("android.widget.TextView")');
      const wordOptions: any[] = [];
      
      for (const element of allTextViews) {
        try {
          const text = await element.getText();
          // Check if it's a valid word (not "Word #X", not "Next", not empty)
          if (text && 
              text.length >= 3 && 
              text.length <= 8 && 
              !text.startsWith('Word #') && 
              text !== 'Next' &&
              text !== 'Back' &&
              /^[a-z]+$/.test(text.trim())) {
            wordOptions.push(element);
          }
        } catch (e) {
          continue;
        }
      }
      
      return wordOptions;
    }
  }

  /**
   * Selects a word option for a specific position
   * @param wordPosition The word position number (e.g., 3, 5, 7, 12)
   * @param expectedWord The expected word from the mnemonic phrase
   */
  async selectWordForPosition(wordPosition: number, expectedWord: string) {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    
    // First, find the "Word #X" label to locate the section
    const wordLabelSelector = isIOS
      ? $(`-ios class chain:**/XCUIElementTypeStaticText[\`name == "Word #${wordPosition}" OR label == "Word #${wordPosition}"\`]`)
      : $(`android=new UiSelector().text("Word #${wordPosition}")`);
    
    await wordLabelSelector.waitForDisplayed({ timeout: 10000 });
    
    // For Android, we can use a more specific approach:
    // Find all TextView elements that contain the expected word
    // and check which ones are clickable/selectable
    if (!isIOS) {
      // Get all instances of the word
      const allWordInstances = await driver.$$(`android=new UiSelector().text("${expectedWord}")`);
      
      // Try each instance to see which one is in the correct section
      // We'll click the first one that's displayed and seems to be a word option
      for (const wordElement of allWordInstances) {
        try {
          const isDisplayed = await wordElement.isDisplayed();
          if (isDisplayed) {
            // Check if it's likely a word option (not a label)
            const text = await wordElement.getText();
            if (text && text.trim().toLowerCase() === expectedWord.toLowerCase()) {
              await wordElement.click();
              await driver.pause(500);
              return;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } else {
      // For iOS, try multiple element types - word options could be Button, Other, or StaticText
      // Since we're on the confirm phrase screen, we can search globally for the word
      const selectors = [
        `-ios class chain:**/XCUIElementTypeButton[\`name == "${expectedWord}" OR label == "${expectedWord}"\`]`,
        `-ios class chain:**/XCUIElementTypeOther[\`name == "${expectedWord}" OR label == "${expectedWord}"\`]`,
        `-ios class chain:**/XCUIElementTypeStaticText[\`name == "${expectedWord}" OR label == "${expectedWord}"\`]`,
      ];
      
      // Try each selector type
      for (const selector of selectors) {
        try {
          const wordElement = $(selector);
          await wordElement.waitForDisplayed({ timeout: 3000 });
          await wordElement.click();
          await driver.pause(500);
          return;
        } catch (e) {
          // Try next selector
          continue;
        }
      }
      
      // If none of the selectors worked, try using accessibility ID
      try {
        const wordElement = $(`~${expectedWord}`);
        await wordElement.waitForDisplayed({ timeout: 3000 });
        await wordElement.click();
        await driver.pause(500);
        return;
      } catch (e) {
        // Fall through to error
      }
      
      throw new Error(`Could not find word option "${expectedWord}" for position ${wordPosition}`);
    }
    
    // Fallback: try direct selector
    const wordButton = this.getWordOptionButton(expectedWord);
    await wordButton.waitForDisplayed({ timeout: 5000 });
    await wordButton.click();
    await driver.pause(500);
  }

  /**
   * Gets the Next button specifically for the Confirm Phrase page
   */
  getConfirmPhrasePageNextButton() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeOther[`name == "Next"`]')
      : $('~Next'); // Using accessibility ID/content-desc
  }

  /**
   * Gets the wallet screen balance element to verify wallet was created
   */
  async getWalletBalanceElement() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    // Look for balance text or wallet screen indicator
    // This is a placeholder - adjust based on actual wallet screen structure
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name CONTAINS "$" OR label CONTAINS "$"`]')
      : $('android=new UiSelector().textMatches(".*\\$.*")');
  }

  /**
   * Verifies we're on the wallet screen by checking for wallet-related elements
   */
  async isOnWalletScreen(): Promise<boolean> {
    try {
      // Wait a bit for screen to load
      await driver.pause(2000);
      
      // Check if we can find wallet-related elements
      // Adjust selectors based on actual wallet screen
      const isIOS = (driver as any).capabilities.platformName === 'iOS';
      const walletIndicator = isIOS
        ? $('-ios class chain:**/XCUIElementTypeStaticText[`name CONTAINS "Wallet" OR label CONTAINS "Wallet"`]')
        : $('android=new UiSelector().textMatches(".*Wallet.*")');
      
      await walletIndicator.waitForDisplayed({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the wallet name element from the wallet screen
   * The wallet name is typically displayed in the header
   */
  getWalletNameElement() {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    // The wallet name appears in the header, typically as a TextView
    // We'll search for it by looking for text that matches our wallet name pattern
    return isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText')
      : $('android=new UiSelector().className("android.widget.TextView")');
  }

  /**
   * Gets the wallet name text from the wallet screen
   */
  async getWalletName(): Promise<string> {
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    
    // First, try to find the specific wallet name we're looking for ("Template Wallet")
    // This is more reliable than searching for any wallet name
    const allTextElements = isIOS
      ? await driver.$$('-ios class chain:**/XCUIElementTypeStaticText')
      : await driver.$$('android=new UiSelector().className("android.widget.TextView")');
    
    // Look for "Template Wallet" specifically first
    for (const element of allTextElements) {
      try {
        const text = await element.getText();
        if (text && text.includes('Template Wallet')) {
          return text.trim();
        }
      } catch (e) {
        continue;
      }
    }
    
    // If not found, look for any text that could be the wallet name (not empty, not common UI text)
    const excludedTexts = ['USD', 'hide', 'Send', 'Receive', 'Suggestions', 'Activity', 'No transactions yet', 'Star repo on GitHub', 'Explore the WDK docs', 'Explore the WDK UI Kit'];
    
    // Prioritize longer text that looks like a wallet name (contains letters and spaces)
    const walletNameCandidates: Array<{ text: string; priority: number }> = [];
    
    for (const element of allTextElements) {
      try {
        const text = await element.getText();
        if (text && 
            text.trim().length > 0 && 
            text.trim().length < 50 &&
            !excludedTexts.some(excluded => text.includes(excluded)) &&
            !text.includes('$') &&
            !text.match(/^\d+\.\d+/) && // Not a number like "0.00"
            text !== 'B' &&
            text !== '₿' && // Exclude Bitcoin symbol
            !/^[^\w\s]+$/.test(text.trim())) { // Exclude single symbols or special characters only
          
          // Calculate priority: longer text with letters and spaces gets higher priority
          const priority = text.trim().length > 5 && /[a-zA-Z]/.test(text) ? 10 : 5;
          walletNameCandidates.push({ text: text.trim(), priority });
        }
      } catch (e) {
        continue;
      }
    }
    
    // Sort by priority (higher first) and return the best candidate
    if (walletNameCandidates.length > 0) {
      walletNameCandidates.sort((a, b) => b.priority - a.priority);
      return walletNameCandidates[0].text;
    }
    
    throw new Error('Could not find wallet name on screen');
  }
}


