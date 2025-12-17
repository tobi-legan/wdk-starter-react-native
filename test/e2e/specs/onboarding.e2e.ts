import { driver, expect, $ } from '@wdio/globals';
import { HomeOnboardingScreen } from '../pageObjects/home-onboarding-screen';
import { WalletCreationFlow } from '../pageObjects/wallet-creation-flow';
import { qase } from '../utils/qase-wrapper';

const homeOnboardingScreen = new HomeOnboardingScreen();
const walletCreationFlow = new WalletCreationFlow();

// Store mnemonic words for later use in confirmation
let savedMnemonicWords: string[] = [];

describe('Onboarding Screen', () => {
  it('TW-1: First launch', qase('TW-1', async () => {
    // Wait for app to load by waiting for the welcome message to appear
    const { titleText, subtitleText } = await homeOnboardingScreen.getTitleAndSubtitleWelcomeMessage();
    expect(titleText).toContain('Welcome!');
    expect(subtitleText).toContain('Set up your wallet and start exploring the crypto world.');

    // Get the button elements using description selector
    const createWalletButton = homeOnboardingScreen.getCreateWalletButton();
    const importWalletButton = homeOnboardingScreen.getImportWalletButton();
    
    // Wait for buttons to be displayed with explicit waits
    await createWalletButton.waitForDisplayed({ timeout: 10000 });
    await importWalletButton.waitForDisplayed({ timeout: 10000 });

    // Verify buttons have correct accessibility label
    // iOS uses 'name' or 'label', Android uses 'content-desc'
    const caps = driver.capabilities as WebdriverIO.Capabilities;
    const isIOS = (caps.platformName || caps['appium:platformName']) === 'iOS';
    const createButtonLabel = isIOS 
      ? (await createWalletButton.getAttribute('name')) || (await createWalletButton.getAttribute('label'))
      : await createWalletButton.getAttribute('content-desc');
    const importButtonLabel = isIOS
      ? (await importWalletButton.getAttribute('name')) || (await importWalletButton.getAttribute('label'))
      : await importWalletButton.getAttribute('content-desc');
    
    expect(createButtonLabel).toContain('Create Wallet');
    expect(importButtonLabel).toContain('Import Wallet');
  }));

  it('TW-2: Verify Template Wallet created', qase('TW-2', async () => {
    // Get platform info for this test
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
    
    // Step 1: Click Create Wallet button
    const createWalletButton = walletCreationFlow.getCreateWalletButton();
    await createWalletButton.waitForDisplayed({ timeout: 10000 });
    await createWalletButton.click();
    // Wait for wallet name input screen to load
    const walletNameInput = walletCreationFlow.getWalletNameInput();
    await walletNameInput.waitForDisplayed({ timeout: 10000 });

    // Step 2: Enter wallet name "Template Wallet"
    await walletNameInput.setValue('Template Wallet');
    // Wait for input to be populated

    // Step 3: Select the first avatar (Bitcoin logo)
    const firstAvatar = walletCreationFlow.getFirstAvatar();
    await firstAvatar.waitForDisplayed({ timeout: 10000 });
    await firstAvatar.click();
    // Wait for avatar selection to register - Next button should appear/enable
    const nameWalletPageNextButton = walletCreationFlow.getNextButton();
    await nameWalletPageNextButton.waitForDisplayed({ timeout: 10000 });

    // Step 4: Click Next to go to secure wallet screen
    await nameWalletPageNextButton.click();
    // Wait for secure wallet screen to load - wait for mnemonic words to appear
    const secureWalletPageNextButton = walletCreationFlow.getSecureWalletPageNextButton();
    await secureWalletPageNextButton.waitForDisplayed({ timeout: 15000 });

    // Step 5: Wait for 12 mnemonic words to be fully loaded before extracting
    await walletCreationFlow.waitForMnemonicWordsToLoad(30000);
    
    // Extract and save mnemonic phrase words
    const mnemonicWords = await walletCreationFlow.getMnemonicWords();
    expect(mnemonicWords.length).toBeGreaterThanOrEqual(12);
    // Save the mnemonic words for later use in confirmation
    savedMnemonicWords = mnemonicWords.slice(0, 12);
    console.log('Saved mnemonic phrase:', savedMnemonicWords.join(' '));

    // Step 6: Click Copy Phrase button
    const copyPhraseButton = walletCreationFlow.getCopyPhraseButton();
    await copyPhraseButton.waitForDisplayed({ timeout: 10000 });
    await copyPhraseButton.click();
    
    // On Android, wait 20 seconds after clicking Copy Phrase to allow sharing dialog to close
    // On iOS, shorter wait for clipboard operation
    if (!isIOS) {
      await new Promise(resolve => setTimeout(resolve, 20000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 7: Click Next to go to confirm phrase screen
    await secureWalletPageNextButton.click();
    // Wait for confirm phrase screen to load - wait for first word position label (Word #3)
    const firstWordLabel = isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name == "Word #3" OR label == "Word #3"`]')
      : $('android=new UiSelector().text("Word #3")');
    await firstWordLabel.waitForDisplayed({ timeout: 15000 });

    // Step 8: Confirm phrase by selecting correct words for each position
    // Word #3 corresponds to savedMnemonicWords[2] (0-indexed, so position 3 is index 2)
    // Word #5 corresponds to savedMnemonicWords[4]
    // Word #7 corresponds to savedMnemonicWords[6]
    // Word #12 corresponds to savedMnemonicWords[11]
    
    expect(savedMnemonicWords.length).toBeGreaterThanOrEqual(12);
    
    // Select word for position 3
    await walletCreationFlow.selectWordForPosition(3, savedMnemonicWords[2]);
    // Wait for next word position (Word #5) to appear
    const word5Label = isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name == "Word #5" OR label == "Word #5"`]')
      : $('android=new UiSelector().text("Word #5")');
    await word5Label.waitForDisplayed({ timeout: 10000 });
    
    // Select word for position 5
    await walletCreationFlow.selectWordForPosition(5, savedMnemonicWords[4]);
    // Wait for next word position (Word #7) to appear
    const word7Label = isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name == "Word #7" OR label == "Word #7"`]')
      : $('android=new UiSelector().text("Word #7")');
    await word7Label.waitForDisplayed({ timeout: 10000 });
    
    // Select word for position 7
    await walletCreationFlow.selectWordForPosition(7, savedMnemonicWords[6]);
    // Wait for next word position (Word #12) to appear
    const word12Label = isIOS
      ? $('-ios class chain:**/XCUIElementTypeStaticText[`name == "Word #12" OR label == "Word #12"`]')
      : $('android=new UiSelector().text("Word #12")');
    await word12Label.waitForDisplayed({ timeout: 10000 });
    
    // Select word for position 12
    await walletCreationFlow.selectWordForPosition(12, savedMnemonicWords[11]);
    // Wait for all words to be selected - next button should be enabled
    const confirmPhrasePageNextButton = walletCreationFlow.getConfirmPhrasePageNextButton();
    await confirmPhrasePageNextButton.waitForDisplayed({ timeout: 10000 });

    // Step 9: Click Next to proceed after confirming all words
    await confirmPhrasePageNextButton.click();
    
    // Step 10: Wait for wallet creation loading to complete
    // The app will show "Creating Your Wallet..." screen, then transition to "You're All Set!"
    // Wait up to 90 seconds for wallet creation to complete (it's not instant)
    await walletCreationFlow.waitForWalletCreationToComplete(90000);
    
    // Step 11: Click "Go To Wallet" button on the final screen
    const goToWalletButton = walletCreationFlow.getGoToWalletButton();
    await goToWalletButton.waitForDisplayed({ timeout: 30000 });
    await goToWalletButton.click();
    
    // Step 12: Wait for wallet screen to load - verify we're on wallet screen
    const isOnWallet = await walletCreationFlow.isOnWalletScreen();
    expect(isOnWallet).toBe(true);

    // Step 13: Verify the wallet name is displayed correctly
    // Wait for wallet name to be available
    const walletName = await walletCreationFlow.getWalletName();
    expect(walletName).toContain('Template Wallet');
    console.log('Wallet name verified:', walletName);
  }));
});
