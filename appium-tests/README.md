# MediTrust Mobile App - Appium E2E Automation Testing Suite

Comprehensive Appium & WebDriverIO End-to-End Functional Test Suite for the MediTrust React Native Mobile Application (Android & iOS).

## Directory Overview
```
appium-tests/
├── tests/
│   └── mobile-e2e-tests.js               # Appium / WebDriverIO mobile E2E test suite
├── generate-appium-excel.js              # Excel report generator (320 mobile test cases)
├── MediTrust_Mobile_Appium_Test_Cases_320.xlsx # Complete generated Excel report
└── package.json                          # Appium, WebDriverIO, and XLSX dependencies
```

## Prerequisites & Installation
1. Start Appium Server (version 2.x):
   ```bash
   appium
   ```

2. Ensure Android Emulator or physical device is connected (`adb devices`):
   ```bash
   adb devices
   ```

3. Install mobile test dependencies:
   ```bash
   cd appium-tests
   npm install
   ```

## Running the Appium Tests
- **Execute Mobile Functional Test Suite:**
  ```bash
  npm test
  ```
- **Custom Platform / Device Execution:**
  ```bash
  PLATFORM=iOS AUTOMATION_NAME=XCUITest DEVICE_NAME="iPhone 15" npm test
  ```

## Generating & Exporting the 300+ Test Cases Excel Workbook
To generate or update the formatted Excel report:
```bash
npm run generate:report
```
The generated spreadsheet `MediTrust_Mobile_Appium_Test_Cases_320.xlsx` includes:
- **Sheet 1: `Appium Mobile Suite Summary`** - Test metrics, pass rates, module-wise test case breakdown, device configurations, and severity distribution.
- **Sheet 2: `Mobile Detailed Test Cases`** - 320 structured mobile test cases with Test ID, Mobile Module, Scenario, Preconditions, Appium Steps, Input Data, Expected UI Behavior, Severity, and Status.
