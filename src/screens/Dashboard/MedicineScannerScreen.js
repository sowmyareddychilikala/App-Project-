import React, { useEffect } from 'react';

export const MedicineScannerScreen = ({ navigation }) => {
  useEffect(() => {
    if (navigation && navigation.replace) {
      navigation.replace('Dashboard');
    }
  }, [navigation]);

  return null;
};

export default MedicineScannerScreen;
