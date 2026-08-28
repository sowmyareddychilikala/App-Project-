import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/Auth/SplashScreen';
import WelcomeScreen from './src/screens/Auth/WelcomeScreen';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegistrationScreen from './src/screens/Auth/RegistrationScreen';
import ForgotPasswordScreen from './src/screens/Auth/ForgotPasswordScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';

// Module 4: Medicine Expiry Management Screens
import MyMedicinesScreen from './src/screens/ExpiryManagement/MyMedicinesScreen';
import MedicineDetailsScreen from './src/screens/ExpiryManagement/MedicineDetailsScreen';
import AddReminderScreen from './src/screens/ExpiryManagement/AddReminderScreen';
import UpcomingExpiriesScreen from './src/screens/ExpiryManagement/UpcomingExpiriesScreen';
import ExpiredMedicinesScreen from './src/screens/ExpiryManagement/ExpiredMedicinesScreen';

// Module 5: Medicine Information Portal Screens
import MedicineSearchScreen from './src/screens/MedicineInformation/MedicineSearchScreen';
import SearchResultsScreen from './src/screens/MedicineInformation/SearchResultsScreen';
import MedicineOverviewScreen from './src/screens/MedicineInformation/MedicineOverviewScreen';
import UsageDosageScreen from './src/screens/MedicineInformation/UsageDosageScreen';
import PrecautionsWarningsScreen from './src/screens/MedicineInformation/PrecautionsWarningsScreen';

// Module 6: Community Experiences & Side Effect Analytics Screens
import ExistingConditionsScreen from './src/screens/CommunityHub/ExistingConditionsScreen';
import CommunityFeedScreen from './src/screens/CommunityHub/CommunityFeedScreen';
import ReportSideEffectScreen from './src/screens/CommunityHub/ReportSideEffectScreen';
import SideEffectAnalyticsScreen from './src/screens/CommunityHub/SideEffectAnalyticsScreen';
import WriteReviewScreen from './src/screens/CommunityHub/WriteReviewScreen';

// Module 7: Clinical Trust System Screens
import PharmacySearchScreen from './src/screens/ClinicalTrust/PharmacySearchScreen';
import SelectPharmacyScreen from './src/screens/ClinicalTrust/SelectPharmacyScreen';
import PharmacyDetailsScreen from './src/screens/ClinicalTrust/PharmacyDetailsScreen';
import SubmitReportScreen from './src/screens/ClinicalTrust/SubmitReportScreen';
import ComplaintHistoryScreen from './src/screens/ClinicalTrust/ComplaintHistoryScreen';
import TrustScoreAnalysisScreen from './src/screens/ClinicalTrust/TrustScoreAnalysisScreen';
import ClinicalTrustFrameworkScreen from './src/screens/ClinicalTrust/ClinicalTrustFrameworkScreen';

// Module 9: Community Safety Network Screens
import SafetyMapScreen from './src/screens/CommunitySafety/SafetyMapScreen';
import CommunityAlertsScreen from './src/screens/CommunitySafety/CommunityAlertsScreen';
import RecentSuspiciousMedicinesScreen from './src/screens/CommunitySafety/RecentSuspiciousMedicinesScreen';
import MedicineRecallAlertsScreen from './src/screens/CommunitySafety/MedicineRecallAlertsScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'http://localhost:8082', 'meditrust://'],
  config: {
    screens: {
      Splash: '',
      Welcome: 'welcome',
      Login: 'login',
      Registration: 'register',
      ForgotPassword: 'forgot-password',
      Dashboard: 'dashboard',
      MyMedicines: 'my-medicines',
      MedicineDetails: 'medicine-details',
      AddReminder: 'add-reminder',
      UpcomingExpiries: 'upcoming-expiries',
      ExpiredMedicines: 'expired-medicines',
      MedicineSearch: 'search',
      SearchResults: 'search-results',
      MedicineOverview: 'medicine-overview',
      UsageDosage: 'usage-dosage',
      PrecautionsWarnings: 'precautions-warnings',
      ExistingConditions: 'existing-conditions',
      CommunityFeed: 'community-feed',
      ReportSideEffect: 'report-side-effect',
      SideEffectAnalytics: 'side-effect-analytics',
      WriteReview: 'write-review',
      PharmacySearch: 'pharmacy-search',
      SelectPharmacy: 'select-pharmacy',
      PharmacyDetails: 'pharmacy-details',
      SubmitReport: 'submit-report',
      ComplaintHistory: 'complaint-history',
      TrustScoreAnalysis: 'trust-score-analysis',
      ClinicalTrustFramework: 'clinical-trust-framework',
      SafetyMap: 'safety-map',
      CommunityAlerts: 'community-alerts',
      RecentSuspiciousMedicines: 'suspicious-medicines',
      MedicineRecallAlerts: 'recall-alerts',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#f8f9fb' }
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegistrationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          
          {/* Module 4 Stack Screens */}
          <Stack.Screen name="MyMedicines" component={MyMedicinesScreen} />
          <Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen} />
          <Stack.Screen name="AddReminder" component={AddReminderScreen} />
          <Stack.Screen name="UpcomingExpiries" component={UpcomingExpiriesScreen} />
          <Stack.Screen name="ExpiredMedicines" component={ExpiredMedicinesScreen} />

          {/* Module 5 Stack Screens */}
          <Stack.Screen name="MedicineSearch" component={MedicineSearchScreen} />
          <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
          <Stack.Screen name="MedicineOverview" component={MedicineOverviewScreen} />
          <Stack.Screen name="UsageDosage" component={UsageDosageScreen} />
          <Stack.Screen name="PrecautionsWarnings" component={PrecautionsWarningsScreen} />

          {/* Module 6 Stack Screens */}
          <Stack.Screen name="ExistingConditions" component={ExistingConditionsScreen} />
          <Stack.Screen name="CommunityFeed" component={CommunityFeedScreen} />
          <Stack.Screen name="ReportSideEffect" component={ReportSideEffectScreen} />
          <Stack.Screen name="SideEffectAnalytics" component={SideEffectAnalyticsScreen} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} />

          {/* Module 7 Stack Screens */}
          <Stack.Screen name="PharmacySearch" component={PharmacySearchScreen} />
          <Stack.Screen name="SelectPharmacy" component={SelectPharmacyScreen} />
          <Stack.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} />
          <Stack.Screen name="SubmitReport" component={SubmitReportScreen} />
          <Stack.Screen name="ComplaintHistory" component={ComplaintHistoryScreen} />
          <Stack.Screen name="TrustScoreAnalysis" component={TrustScoreAnalysisScreen} />
          <Stack.Screen name="ClinicalTrustFramework" component={ClinicalTrustFrameworkScreen} />

          {/* Module 9 Stack Screens */}
          <Stack.Screen name="SafetyMap" component={SafetyMapScreen} />
          <Stack.Screen name="CommunityAlerts" component={CommunityAlertsScreen} />
          <Stack.Screen name="RecentSuspiciousMedicines" component={RecentSuspiciousMedicinesScreen} />
          <Stack.Screen name="MedicineRecallAlerts" component={MedicineRecallAlertsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

