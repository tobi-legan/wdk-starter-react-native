import { driver, expect } from '@wdio/globals';
import { HomeOnboardingScreen } from '../pageObjects/home-onboarding-screen';
import { WalletImportFlow } from '../pageObjects/wallet-import-flow';
import { qase } from '../utils/qase-wrapper';

/**
 * Helper function to get platform name from driver capabilities
 */
function getPlatformName(): 'iOS' | 'Android' {
  const caps = driver.capabilities as Record<string, unknown>;
  const platformName = 
    (caps.platformName as string) ||
    (caps['appium:platformName'] as string) ||
    '';
  
  return platformName === 'iOS' ? 'iOS' : 'Android';
}

const homeOnboardingScreen = new HomeOnboardingScreen();
const walletImportFlow = new WalletImportFlow();

// Test mnemonic phrase (from previous iOS test run)
const TEST_MNEMONIC_PHRASE = 'tree crop spring swamp onion tip divorce chalk win stable parade giraffe';

describe('Wallet Import Flow', () => {
  it('TW-3: Import wallet via secret phrase', qase('TW-3', async () => {
    // Step 1: Wait for app to load and verify we're on onboarding screen
    const { titleText } = await homeOnboardingScreen.getTitleAndSubtitleWelcomeMessage();
    expect(titleText).toContain('Welcome!');

    // Step 2: Click Import Wallet button
    const importWalletButton = homeOnboardingScreen.getImportWalletButton();
    await importWalletButton.waitForDisplayed({ timeout: 10000 });
    await importWalletButton.click();

    // Step 3: Wait for Import via Secret Phrase screen to load
    // Verify we're on the import screen by waiting for the Paste button or title
    const pasteButton = walletImportFlow.getPasteButton();
    await pasteButton.waitForDisplayed({ timeout: 15000 });

    // Step 3.5: Check Import Wallet button state before pasting (for logging)
    const importWalletButtonOnScreen = walletImportFlow.getImportWalletButtonOnScreen();
    await importWalletButtonOnScreen.waitForDisplayed({ timeout: 10000 });
    const isEnabledBeforePaste = await importWalletButtonOnScreen.isEnabled();
    const isIOS = getPlatformName() === 'iOS';
    console.log(`[Wallet Import] Import Wallet button state before pasting: ${isEnabledBeforePaste ? 'enabled' : 'disabled'} (${isIOS ? 'iOS' : 'Android'})`);

    // Step 4: Paste the mnemonic phrase using the Paste button
    await walletImportFlow.pasteMnemonicPhrase(TEST_MNEMONIC_PHRASE);

    // Step 5: Verify Import Wallet button is now enabled after pasting
    await importWalletButtonOnScreen.waitForDisplayed({ timeout: 10000 });
    const isEnabledAfterPaste = await importWalletButtonOnScreen.isEnabled();
    expect(isEnabledAfterPaste).toBe(true);
    console.log('[Wallet Import] Verified Import Wallet button is enabled after pasting');

    // Step 6: Click Import Wallet button to go to "Name Your Wallet" screen
    await importWalletButtonOnScreen.click();

    // Step 7: Wait for "Name Your Wallet" screen to load
    const walletNameInput = await walletImportFlow.getWalletNameInput();
    await walletNameInput.waitForDisplayed({ timeout: 15000 });

    // Step 8: Enter wallet name
    await walletNameInput.click();
    await walletNameInput.setValue('Imported Wallet');

    // Step 9: Select the first avatar (Bitcoin logo)
    const firstAvatar = walletImportFlow.getFirstAvatar();
    await firstAvatar.waitForDisplayed({ timeout: 10000 });
    await firstAvatar.click();
    
    // Step 10: Click Import Wallet button on "Name Your Wallet" screen
    // Wait for avatar selection to register - verify Import Wallet button is displayed
    const nameWalletScreenImportButton = walletImportFlow.getNameWalletScreenImportButton();
    await nameWalletScreenImportButton.waitForDisplayed({ timeout: 10000 });
    await nameWalletScreenImportButton.click();

    // Step 11: Wait for import to complete (loading state -> wallet screen)
    await walletImportFlow.waitForImportToComplete(90000);

    // Step 12: Verify we're on the wallet screen
    const isOnWallet = await walletImportFlow.isOnWalletScreen();
    expect(isOnWallet).toBe(true);
    console.log('[Wallet Import] Successfully imported wallet and navigated to wallet screen');
  }));
});

