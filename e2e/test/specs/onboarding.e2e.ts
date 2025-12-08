import { driver, expect } from '@wdio/globals';
import { HomeOnboardingScreen } from '../../pageObjects/home-onboarding-screen';
import { WalletCreationFlow } from '../../pageObjects/wallet-creation-flow';
import { qase } from '../../utils/qase-wrapper';

const homeOnboardingScreen = new HomeOnboardingScreen();
const walletCreationFlow = new WalletCreationFlow();

// Store mnemonic words for later use in confirmation
let savedMnemonicWords: string[] = [];

describe('Onboarding Screen', () => {
  it('TW-1: First launch', qase('TW-1', async () => {
    // Wait for app to load
    await driver.pause(3000);

    // Verify driver session exists
    const sessionId = (driver as any).sessionId;
    expect(sessionId).toBeDefined();

    // Verify welcome message
    const { titleText, subtitleText } = await homeOnboardingScreen.getTitleAndSubtitleWelcomeMessage();
    expect(titleText).toContain('Welcome!');
    expect(subtitleText).toContain('Set up your wallet and start exploring the crypto world.');

    // Get the button elements using description selector
    const createWalletButton = homeOnboardingScreen.getCreateWalletButton();
    const importWalletButton = homeOnboardingScreen.getImportWalletButton();
    
    // Verify buttons are displayed
    await expect(createWalletButton).toBeDisplayed();
    await expect(importWalletButton).toBeDisplayed();

    // Verify buttons have correct accessibility label
    // iOS uses 'name' or 'label', Android uses 'content-desc'
    const isIOS = (driver as any).capabilities.platformName === 'iOS';
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
    // Wait for app to load
    await driver.pause(3000);

    // Step 1: Click Create Wallet button
    const createWalletButton = walletCreationFlow.getCreateWalletButton();
    await expect(createWalletButton).toBeDisplayed();
    await createWalletButton.click();
    await driver.pause(2000);

    // Step 2: Enter wallet name "Template Wallet"
    const walletNameInput = walletCreationFlow.getWalletNameInput();
    await walletNameInput.waitForDisplayed({ timeout: 10000 });
    await walletNameInput.setValue('Template Wallet');
    await driver.pause(1000);

    // Step 3: Select the first avatar (Bitcoin logo)
    const firstAvatar = walletCreationFlow.getFirstAvatar();
    await firstAvatar.waitForDisplayed({ timeout: 10000 });
    await firstAvatar.click();
    await driver.pause(500);

    // Step 4: Click Next to go to secure wallet screen
    const nameWalletPageNextButton = walletCreationFlow.getNextButton();
    await nameWalletPageNextButton.waitForDisplayed({ timeout: 10000 });
    await nameWalletPageNextButton.click();
    await driver.pause(3000); // Wait for secure wallet screen to load

    // Step 5: Extract and save mnemonic phrase words
    const mnemonicWords = await walletCreationFlow.getMnemonicWords();
    expect(mnemonicWords.length).toBeGreaterThanOrEqual(12);
    // Save the mnemonic words for later use in confirmation
    savedMnemonicWords = mnemonicWords.slice(0, 12);
    console.log('Saved mnemonic phrase:', savedMnemonicWords.join(' '));

    // Step 6: Optionally click Copy Phrase button
    const copyPhraseButton = walletCreationFlow.getCopyPhraseButton();
    await copyPhraseButton.waitForDisplayed({ timeout: 10000 });
    await copyPhraseButton.click();
    await driver.pause(1000);

    // Step 7: Click Next to go to confirm phrase screen
    const secureWalletPageNextButton = walletCreationFlow.getSecureWalletPageNextButton();
    await secureWalletPageNextButton.waitForDisplayed({ timeout: 10000 });
    await secureWalletPageNextButton.click();
    await driver.pause(3000); // Wait for confirm phrase screen to load

    // Step 8: Confirm phrase by selecting correct words for each position
    // Word #3 corresponds to savedMnemonicWords[2] (0-indexed, so position 3 is index 2)
    // Word #5 corresponds to savedMnemonicWords[4]
    // Word #7 corresponds to savedMnemonicWords[6]
    // Word #12 corresponds to savedMnemonicWords[11]
    
    expect(savedMnemonicWords.length).toBeGreaterThanOrEqual(12);
    
    // Select word for position 3
    await walletCreationFlow.selectWordForPosition(3, savedMnemonicWords[2]);
    await driver.pause(500);
    
    // Select word for position 5
    await walletCreationFlow.selectWordForPosition(5, savedMnemonicWords[4]);
    await driver.pause(500);
    
    // Select word for position 7
    await walletCreationFlow.selectWordForPosition(7, savedMnemonicWords[6]);
    await driver.pause(500);
    
    // Select word for position 12
    await walletCreationFlow.selectWordForPosition(12, savedMnemonicWords[11]);
    await driver.pause(1000);

    // Step 9: Click Next to proceed after confirming all words
    const confirmPhrasePageNextButton = walletCreationFlow.getConfirmPhrasePageNextButton();
    await confirmPhrasePageNextButton.waitForDisplayed({ timeout: 10000 });
    await confirmPhrasePageNextButton.click();
    
    // Step 10: Wait for wallet creation loading to complete
    // The app will show "Creating Your Wallet..." screen, then transition to "You're All Set!"
    // Add a pause to allow the loading state to start
    await driver.pause(2000);
    // Wait up to 90 seconds for wallet creation to complete (it's not instant)
    await walletCreationFlow.waitForWalletCreationToComplete(90000);
    
    // Step 11: Click "Go To Wallet" button on the final screen
    const goToWalletButton = walletCreationFlow.getGoToWalletButton();
    await goToWalletButton.waitForDisplayed({ timeout: 30000 });
    await goToWalletButton.click();
    await driver.pause(3000); // Wait for wallet screen to load

    // Step 12: Verify wallet was created by checking if we're on wallet screen
    const isOnWallet = await walletCreationFlow.isOnWalletScreen();
    expect(isOnWallet).toBe(true);

    // Step 13: Verify the wallet name is displayed correctly
    const walletName = await walletCreationFlow.getWalletName();
    expect(walletName).toContain('Template Wallet');
    console.log('Wallet name verified:', walletName);
  }));
});
