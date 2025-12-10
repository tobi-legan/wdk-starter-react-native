import { $, driver } from '@wdio/globals';

/**
 * Helper function to get platform name from driver capabilities
 * @returns 'iOS' or 'Android' based on capabilities
 */
function getPlatformName(): 'iOS' | 'Android' {
  const caps = driver.capabilities as Record<string, unknown>;
  const platformName = 
    (caps.platformName as string) ||
    (caps['appium:platformName'] as string) ||
    '';
  
  return platformName === 'iOS' ? 'iOS' : 'Android';
}

export class WalletImportFlow {
  /**
   * Gets the Import Wallet button from onboarding screen
   */
  getImportWalletButton() {
    return $('~Import Wallet');
  }

  /**
   * Gets the Paste button on the Import via Secret Phrase screen
   */
  getPasteButton() {
    const isIOS = getPlatformName() === 'iOS';
    return isIOS ? $('~Paste') : $('android=new UiSelector().text("Paste")');
  }

  /**
   * Gets the Import Wallet button on the Import via Secret Phrase screen
   */
  getImportWalletButtonOnScreen() {
    const isIOS = getPlatformName() === 'iOS';
    return isIOS ? $('~Import Wallet') : $('android=new UiSelector().text("Import Wallet")');
  }

  /**
   * Gets the wallet name input field on the "Name Your Wallet" screen
   */
  async getWalletNameInput() {
    const isIOS = getPlatformName() === 'iOS';
    if (isIOS) {
      const textFields = await driver.$$('-ios class chain:**/XCUIElementTypeTextField');
      const count = await textFields.length;
      if (count > 0) {
        return textFields[0];
      }
      return $('~Wallet Name');
    }
    const editTexts = await driver.$$('android=new UiSelector().className("android.widget.EditText")');
    const count = await editTexts.length;
    if (count > 0) {
      return editTexts[0];
    }
    throw new Error('Could not find wallet name input field');
  }

  /**
   * Gets the first avatar element (Bitcoin logo) on the "Name Your Wallet" screen
   */
  getFirstAvatar() {
    const isIOS = getPlatformName() === 'iOS';
    return isIOS
      ? $('-ios predicate string:name == "₿" AND label == "₿" AND type == "XCUIElementTypeOther"')
      : $('~₿');
  }

  /**
   * Gets the Import Wallet button on the "Name Your Wallet" screen
   */
  getNameWalletScreenImportButton() {
    const isIOS = getPlatformName() === 'iOS';
    return isIOS
      ? $('~Import Wallet')
      : $('android=new UiSelector().description("Import Wallet")');
  }

  /**
   * Waits for the importing loading state to complete
   * @param timeout Maximum time to wait in milliseconds (default: 90000)
   */
  async waitForImportToComplete(timeout: number = 90000): Promise<void> {
    const isIOS = getPlatformName() === 'iOS';
    const importingText = isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name == "Importing..." OR label == "Importing..."`]')
      : $('android=new UiSelector().text("Importing...")');
    
    try {
      await importingText.waitForDisplayed({ timeout: 10000 }).catch(() => {});
      await importingText.waitForDisplayed({ timeout, reverse: true });
      
      const walletIndicator = isIOS
        ? $('-ios class chain:**/XCUIElementTypeStaticText[`name CONTAINS "Wallet" OR label CONTAINS "Wallet"`]')
        : $('android=new UiSelector().textMatches(".*Wallet.*")');
      await walletIndicator.waitForDisplayed({ timeout: 10000 });
    } catch (error) {
      const walletIndicator = isIOS
        ? $('-ios class chain:**/XCUIElementTypeStaticText[`name CONTAINS "Wallet" OR label CONTAINS "Wallet"`]')
        : $('android=new UiSelector().textMatches(".*Wallet.*")');
      await walletIndicator.waitForDisplayed({ timeout });
    }
  }

  /**
   * Verifies we're on the wallet screen by checking for wallet-related elements
   */
  async isOnWalletScreen(): Promise<boolean> {
    try {
      const isIOS = getPlatformName() === 'iOS';
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
   * Gets a specific mnemonic word input field by index (1-12)
   * @param index The 1-indexed position of the word (1-12)
   */
  async getWordInputField(index: number) {
    const isIOS = getPlatformName() === 'iOS';
    
    if (isIOS) {
      const textFields = await driver.$$('-ios class chain:**/XCUIElementTypeTextField');
      const count = await textFields.length;
      if (count >= index) {
        return textFields[index - 1];
      }
      throw new Error(`Could not find text field at index ${index} (found ${count} fields)`);
    } else {
      const editTexts = await driver.$$('android=new UiSelector().className("android.widget.EditText")');
      const count = await editTexts.length;
      if (count >= index) {
        return editTexts[index - 1];
      }
      throw new Error(`Could not find EditText field at index ${index} (found ${count} fields)`);
    }
  }

  /**
   * Sets clipboard content using Appium's setClipboard API
   * @param text The text to set in clipboard
   */
  async setClipboard(text: string): Promise<void> {
    const isIOS = getPlatformName() === 'iOS';
    const driverWithClipboard = driver as typeof driver & { 
      setClipboard?: (content: string, contentType?: string, label?: string) => Promise<void> 
    };
    
    if (typeof driverWithClipboard.setClipboard === 'function') {
      // Both iOS and Android require base64-encoded content
      const base64Content = Buffer.from(text).toString('base64');
      await driverWithClipboard.setClipboard(base64Content, 'plaintext');
    } else {
      throw new Error('Appium setClipboard API not available');
    }
  }

  /**
   * Pastes the mnemonic phrase using the Paste button
   * The iOS "Allow Paste" system alert is automatically handled by 
   * the 'appium:autoAcceptAlerts: true' capability in wdio.ios.conf.ts
   * @param mnemonicPhrase The space-separated mnemonic phrase
   */
  async pasteMnemonicPhrase(mnemonicPhrase: string): Promise<void> {
    await this.setClipboard(mnemonicPhrase);
    
    const pasteButton = this.getPasteButton();
    await pasteButton.waitForDisplayed({ timeout: 10000 });
    await pasteButton.click();
    
    // Verify paste worked by checking first input field
    const firstInput = await this.getWordInputField(1);
    await firstInput.waitForDisplayed({ timeout: 10000 });
    
    // Wait for first word to appear
    let attempts = 0;
    let firstWordValue = '';
    while (attempts < 10 && (!firstWordValue || firstWordValue.trim() === '')) {
      await new Promise(resolve => setTimeout(resolve, 500));
      firstWordValue = await firstInput.getText();
      attempts++;
    }
    
    if (!firstWordValue || firstWordValue.trim() === '') {
      throw new Error('First word field is empty after paste - paste may not have worked');
    }
    
    // Wait for Import Wallet button to be enabled (indicates all words are pasted)
    const importButton = this.getImportWalletButtonOnScreen();
    await importButton.waitForDisplayed({ timeout: 10000 });
    await importButton.waitForEnabled({ timeout: 10000 });
  }
}

