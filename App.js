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
import MedicineScannerScreen from './src/screens/Dashboard/MedicineScannerScreen';

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

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
          <Stack.Screen name="MedicineScanner" component={MedicineScannerScreen} />
          
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

