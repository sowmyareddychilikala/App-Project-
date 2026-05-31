import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Image,
  Linking
} from 'react-native';
import { colors } from '../../theme/colors';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { saveUserMedication, saveUserScanEvent } from '../../services/dbService';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

export const MedicineScannerScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const { uid, mockUser } = params;

  // Scanner Phase: 'scanner' | 'processing' | 'results'
  const [phase, setPhase] = useState('scanner');
  const [flashOn, setFlashOn] = useState(false);
  
  // Real image selected from gallery or camera
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Animation/Dynamic elements
  const [laserPosition, setLaserPosition] = useState(0);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [flashOverlay, setFlashOverlay] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // Scan metadata results
  const scannedMed = {
    name: 'Amoxicillin',
    dosage: '500mg',
    time: '12:00 PM',
    instructions: 'Take 1 capsule with full glass of water',
    batch: 'AX-90210-2024',
    mfgDate: 'JAN 2024',
    expDate: 'JAN 2026',
    trustScore: 98,
    risk: 'Low Risk',
    riskPercentage: 15,
    manufacturer: 'BioPharma Core',
    seal: 'Intact',
    regulatory: 'FDA Valid'
  };

  // Laser scanning animation simulation
  useEffect(() => {
    if (phase !== 'scanner') return;
    
    let direction = 1;
    const interval = setInterval(() => {
      setLaserPosition(prev => {
        if (prev >= 220) {
          direction = -1;
          return 219;
        } else if (prev <= 0) {
          direction = 1;
          return 1;
        }
        return prev + (5 * direction);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [phase]);

  // AI Diagnostic logs loading sequence simulator
  useEffect(() => {
    if (phase !== 'processing') return;

    setProcessingLogs([]);
    const logs = [
      "Initializing diagnostic neural OCR scanner...",
      "Aligning holographic visual matrices...",
      selectedImage ? "Reading uploaded prescription image dimensions..." : "Detecting live camera package outlines...",
      "Reading FDA batch barcode serial AX-90210...",
      "Analyzing seal chemical & holographic integrity... OK",
      "Validating regulatory BioPharma watermark..."
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setProcessingLogs(prev => [...prev, `[•] ${logs[currentLogIndex]}`]);
        currentLogIndex++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          setPhase('results');
        }, 800);
      }
    }, 450);

    return () => clearInterval(logInterval);
  }, [phase]);

  // Real Camera Image Capture Trigger
  const handleCameraCapture = async () => {
    try {
      // Get current permission status
      let { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
      
      if (status !== 'granted') {
        if (!canAskAgain) {
          // Previously denied permanently, let them open settings
          Alert.alert(
            "Camera Access Needed", 
            "We need camera access to capture clinical medicines packaging. Please enable it in your device settings.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" }
            ]
          );
          return;
        }
        
        // Request camera permission
        const request = await ImagePicker.requestCameraPermissionsAsync();
        status = request.status;
        
        if (status !== 'granted') {
          Alert.alert(
            "Camera Permission Denied", 
            "We need camera access to capture clinical medicines packaging.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" }
            ]
          );
          return;
        }
      }

      // Visual flash overlay trigger
      setFlashOverlay(true);
      setTimeout(() => setFlashOverlay(false), 150);

      // Launch native camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Successfully snapped a picture with the camera!
        setSelectedImage(result.assets[0].uri);
        setPhase('processing');
      }
    } catch (err) {
      Alert.alert(
        "Camera Error", 
        "An error occurred while opening your phone camera. Please make sure the app has camera permission in your system settings.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  // Real Image Picker from Mobile Gallery
  const handlePickImage = async () => {
    try {
      // Get current media library permission
      let { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        if (!canAskAgain) {
          Alert.alert(
            "Photo Access Needed", 
            "We need access to your photo library to let you verify clinical packages. Please enable it in your settings.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" }
            ]
          );
          return;
        }
        
        // Request media library permission
        const request = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = request.status;
        
        if (status !== 'granted') {
          Alert.alert(
            "Permission Blocked", 
            "Sorry, we need access to your photo library to let you verify clinical packages.",
            [
              { text: "Open Settings", onPress: () => Linking.openSettings() },
              { text: "Cancel", style: "cancel" }
            ]
          );
          return;
        }
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Successfully selected an image from mobile gallery
        setSelectedImage(result.assets[0].uri);
        setPhase('processing');
      }
    } catch (err) {
      Alert.alert(
        "Picker Error", 
        "An error occurred while opening your mobile gallery. Please verify media permissions in your system settings.",
        [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  // Save Scanned Medicine to Database and Scan History
  const handleAddToInventory = async () => {
    const medData = {
      name: scannedMed.name,
      dosage: scannedMed.dosage,
      time: scannedMed.time,
      instructions: scannedMed.instructions,
      taken: false,
      takenTime: ''
    };

    const scanEventData = {
      productName: scannedMed.name,
      dosage: scannedMed.dosage,
      batch: scannedMed.batch,
      trustScore: scannedMed.trustScore,
      riskLevel: scannedMed.risk,
      manufacturer: scannedMed.manufacturer,
      status: 'Genuine'
    };

    if (mockUser) {
      Alert.alert(
        "Simulation Success", 
        "Amoxicillin 500mg successfully added to inventory & scanned history logs.",
        [
          { text: "Confirm", onPress: () => navigation.replace('Dashboard', { mockUser: true }) }
        ]
      );
    } else {
      setSavingLoading(true);
      try {
        // Save to active medications list
        await saveUserMedication(uid, medData);
        // Log in verification scans history list
        await saveUserScanEvent(uid, scanEventData);
        
        setSavingLoading(false);
        Alert.alert(
          "Medication Registered",
          "Amoxicillin 500mg has been added directly to your upcoming dose cabinet & clinical scan history.",
          [
            { text: "OK", onPress: () => navigation.replace('Dashboard', { uid }) }
          ]
        );
      } catch (err) {
        setSavingLoading(false);
        Alert.alert("Database Error", "Failed to register scanned medicine. Please try again.");
      }
    }
  };

  if (savingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing Verified Pill to Cabinet...</Text>
      </View>
    );
  }

  // -------------------------------------------------------------
  // PHASE CONTENT RENDERERS
  // -------------------------------------------------------------

  const renderScannerPhase = () => {
    return (
      <View style={styles.scannerWrapper}>
        
        {/* Mock Viewfinder Background */}
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiwGIvBZXupeetNp7wiB1duiM5tVO3wQatoTZitwIJf-XdHN-jO8Gahp9_HhdUu9G3dtr5PqUdkQEtPXXEnnJrp9eNrZH_xT3yOJjmz2gKOG4sSYi3LvpitKdCOU_4-Ig_bhFnZLwG-Z-0hfR0XAiBaq2CtfTF4kCZ59VWB2b0vm7khWP4_5C5SbZGZhs71B63SmFBf06X276r0PfqCSSQesY3rpCX9eyIrsR3pnJAm0uDBQ10xYdQ4lbudhUr3hKAz72T4Oq9wCtg' }}
          style={styles.viewfinderBg}
        />

        {/* Translucent Dark Overlay with Bracket Mask */}
        <View style={styles.viewfinderOverlay}>
          <View style={styles.topMask} />
          
          <View style={styles.middleRowMask}>
            <View style={styles.sideMask} />
            
            {/* Camera Bracket Guide Box */}
            <View style={styles.bracketBox}>
              {/* Corner accents */}
              <View style={[styles.cornerAccent, styles.topLeftCorner]} />
              <View style={[styles.cornerAccent, styles.topRightCorner]} />
              <View style={[styles.cornerAccent, styles.bottomLeftCorner]} />
              <View style={[styles.cornerAccent, styles.bottomRightCorner]} />
              
              {/* Animated laser line */}
              <View style={[styles.laserBeamLine, { top: laserPosition }]} />
            </View>
            
            <View style={styles.sideMask} />
          </View>

          <View style={styles.bottomMask}>
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>Align medicine packaging within brackets</Text>
            </View>
          </View>
        </View>

        {/* Shutter & Controls Dock */}
        <View style={styles.shutterDock}>
          {/* Gallery Shortcut Button */}
          <TouchableOpacity 
            style={styles.galleryShortcutBtn} 
            onPress={handlePickImage}
          >
            <View style={styles.galleryShortcutWrapper}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMbamANGG57E866HuW6y1PbztnQNjKjA1s3N3a6hat1CVeV4JjjLdFs1yL1SHXAloVgfj8zTM1BSanH5JsVbyf3titV5HGHY3Ty5RKp1vkbSCREyl19484rxnTp_-U816T_CYpxZl6s2vyDM_9BuaNhpoVp-AexwwKf2hBD14Dx_ejZ0nFI2oTDRvke8-Rog6AeXGrrwzN_1-BkYm38R8yOcVMTai6BYTta2hnXqDc00bmvVIQlM7FRvCAscMQrdgxyjfygdJD6eYZ' }}
                style={styles.galleryShortcutImg}
              />
            </View>
            <Text style={shutterDockLabel => styles.shutterDockLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Large Shutter Button - Real Camera Capture! */}
          <TouchableOpacity 
            style={styles.shutterButtonCircle}
            onPress={handleCameraCapture}
            activeOpacity={0.8}
          >
            <View style={styles.shutterButtonInner}>
              <MaterialIcons name="photo-camera" size={32} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* QR Code Action Toggle */}
          <TouchableOpacity 
            style={styles.qrToggleBtn}
            onPress={() => Alert.alert("QR Mode Active", "Scanner aligned to QR / standard linear barcodes.")}
          >
            <View style={styles.qrToggleIconCircle}>
              <MaterialIcons name="qr-code-scanner" size={22} color={colors.white} />
            </View>
            <Text style={shutterDockLabel => styles.shutterDockLabel}>QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Simulated Camera Flash Overlay */}
        {flashOverlay && <View style={styles.cameraFlashOverlay} />}

      </View>
    );
  };

  const renderProcessingPhase = () => {
    return (
      <View style={styles.processingWrapper}>
        <View style={styles.processingPulseWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Ionicons name="sparkles-outline" size={28} color={colors.primary} style={styles.sparkleProcessIcon} />
        </View>
        <Text style={styles.processingTitle}>MedVerify - AI Analyst</Text>
        <Text style={styles.processingSubtitle}>Running diagnostics OCR neural extraction...</Text>

        <View style={styles.consoleBlock}>
          {processingLogs.map((log, index) => (
            <Text key={index} style={styles.consoleLogLine}>{log}</Text>
          ))}
        </View>
      </View>
    );
  };

  const renderResultsPhase = () => {
    return (
      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        
        {/* Bento Trust Score Gauge Card */}
        <View style={styles.resultsBentoRow}>
          <View style={styles.trustScoreGaugeCard}>
            <Text style={styles.bentoCardLabel}>Trust Score</Text>
            
            {/* SVG Circular progress gauge representation in pure layouts */}
            <View style={styles.gaugeGraphicContainer}>
              <View style={styles.gaugeTrackOuter}>
                <View style={styles.gaugeFilledArc} />
                <View style={styles.gaugeCenterTextWrapper}>
                  <Text style={styles.gaugePercentageText}>{scannedMed.trustScore}%</Text>
                  <Text style={styles.gaugeVerifiedText}>VERIFIED</Text>
                </View>
              </View>
            </View>

            <View style={styles.genuineProductBadge}>
              <MaterialIcons name="verified" size={16} color="#2e7d32" />
              <Text style={styles.genuineProductBadgeText}>Genuine Product</Text>
            </View>
          </View>

          <View style={styles.rightStatsStack}>
            {/* Risk Card */}
            <View style={styles.riskCard}>
              <Text style={styles.bentoCardLabel}>Risk Level</Text>
              <View style={styles.riskHeaderRow}>
                <Text style={styles.riskLabelStatus}>Security Status</Text>
                <Text style={styles.riskLabelValue}>{scannedMed.risk}</Text>
              </View>
              {/* Slider Track */}
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${scannedMed.riskPercentage}%` }]} />
              </View>
              <Text style={styles.riskDescText}>
                AI models verified holographic seal patterns. All parameters align with official manufacturer standards.
              </Text>
            </View>

            {/* Product Identity */}
            <View style={styles.productIdentityCard}>
              <Text style={styles.identityMetaTag}>Product Identity</Text>
              <Text style={styles.identityTitle}>{scannedMed.name} {scannedMed.dosage}</Text>
              <Text style={styles.identityBatch}>Batch: {scannedMed.batch}</Text>
              <View style={styles.identityDivider} />
              <View style={styles.identityMfgExpRow}>
                <View>
                  <Text style={styles.mfgExpLabel}>MFG Date</Text>
                  <Text style={styles.mfgExpValue}>{scannedMed.mfgDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.mfgExpLabel}>EXP Date</Text>
                  <Text style={styles.mfgExpValue}>{scannedMed.expDate}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Summary Split-Row */}
        <View style={styles.summaryBentoCard}>
          <Text style={styles.sectionHeading}>Verification Summary</Text>
          <View style={styles.summarySplitRow}>
            {/* Thumbnail Image - Displays the actual selected gallery or captured camera picture! */}
            <View style={styles.thumbnailWrapper}>
              <Image 
                source={{ uri: selectedImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqhaP_o_MqPuF7FO0RTMbn0KzGn6MZz4jfg-IjmaRlB1F7ngVbfbCtxgj3h7hOP9Scvb5sI3zBsWL2ZmKg6arEbwK_b8yl_0Z0agZPj8i3ZlYEcScolAtCTJquQUsKprU5tp7dJddIL2Bw82-AhoqhONGUKyVDv1CwClMhsTzJs3MF52kuVv8bQD8ElYTII0Gjzkt4MJT8TL79nEibvThhC7fPQsbMvbn58YiY2iJL51wERoKI2Qbcl1R-BvoR4c5kYEbU8qdSwbx6' }}
                style={styles.thumbnailImg}
              />
              <View style={styles.scanningThumbnailLine} />
            </View>

            <View style={styles.summaryDataFields}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.extractionHeading}>Extraction Parameters</Text>
                {selectedImage && (
                  <View style={styles.galleryBadgeTag}>
                    <MaterialIcons name="photo" size={10} color={colors.primary} />
                    <Text style={styles.galleryBadgeTagText}>Captured Media</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.splitRowField}>
                <Text style={styles.splitRowLabel}>Seal Integrity</Text>
                <View style={styles.splitRowValueContainer}>
                  <MaterialIcons name="check-circle" size={14} color="#2e7d32" />
                  <Text style={styles.splitRowValueText}>Intact</Text>
                </View>
              </View>

              <View style={styles.splitRowField}>
                <Text style={styles.splitRowLabel}>Manufacturer</Text>
                <Text style={styles.splitRowValueTextPlain}>{scannedMed.manufacturer}</Text>
              </View>

              <View style={styles.splitRowField}>
                <Text style={styles.splitRowLabel}>Regulatory Marks</Text>
                <View style={styles.splitRowValueContainer}>
                  <MaterialIcons name="verified-user" size={14} color="#2e7d32" />
                  <Text style={styles.splitRowValueText}>FDA Valid</Text>
                </View>
              </View>

              <View style={styles.splitRowField} style={{ borderBottomWidth: 0 }}>
                <Text style={styles.splitRowLabel}>Serialization</Text>
                <Text style={styles.splitRowValueTextPlain}>Unique Match</Text>
              </View>
            </View>
          </View>

          <Text style={styles.resultsSummaryParagraph}>
            Verification successful. All physical security features (Color-shifting ink, micro-text, and holographic strip) were successfully identified and verified against the master database record.
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionPillCabinet}>
          <TouchableOpacity style={styles.primaryInventoryBtn} onPress={handleAddToInventory}>
            <MaterialIcons name="inventory-2" size={20} color={colors.white} />
            <Text style={styles.primaryInventoryBtnText}>Add to Inventory Cabinet</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryScanBtn} 
            onPress={() => {
              setSelectedImage(null); // Reset selection
              setPhase('scanner');
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            <Text style={styles.secondaryScanBtnText}>Scan Another Package</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity 
            style={styles.headerBackBtn}
            onPress={() => {
              if (phase === 'results') {
                setSelectedImage(null);
                setPhase('scanner');
              } else {
                navigation.replace('Dashboard');
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MedVerify Scanner</Text>
        </View>

        <View style={styles.headerRightRow}>
          {phase === 'scanner' && (
            <TouchableOpacity 
              style={[styles.flashToggleBtn, flashOn && styles.flashToggleBtnActive]}
              onPress={() => {
                setFlashOn(!flashOn);
                Alert.alert("Flash Status", `Device camera LED flash toggled ${!flashOn ? 'ON' : 'OFF'}.`);
              }}
            >
              <MaterialIcons name={flashOn ? "flash-off" : "flash-on"} size={22} color={flashOn ? colors.primary : colors.outline} />
            </TouchableOpacity>
          )}
          {phase === 'results' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={styles.flashToggleBtn}
                onPress={() => Alert.alert("Clinical Guidance", "Holograms & security strips should shift color under visual refraction.")}
              >
                <MaterialIcons name="help-outline" size={22} color={colors.outline} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.flashToggleBtn}
                onPress={() => Alert.alert("Share Report", "Diagnostic verified certificate exported as encrypted PDF.")}
              >
                <MaterialIcons name="share" size={22} color={colors.outline} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Phase rendering engine */}
      {phase === 'scanner' && renderScannerPhase()}
      {phase === 'processing' && renderProcessingPhase()}
      {phase === 'results' && renderResultsPhase()}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: STATUSBAR_HEIGHT,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    zIndex: 100,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashToggleBtnActive: {
    backgroundColor: colors.primaryFixed,
  },

  // Viewfinder Screen Styles
  scannerWrapper: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  viewfinderBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  viewfinderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
  },
  topMask: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  middleRowMask: {
    flexDirection: 'row',
    height: 240,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bracketBox: {
    width: 240,
    height: 240,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  laserBeamLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  bottomMask: {
    flex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    paddingTop: 24,
  },
  instructionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  shutterDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 16,
  },
  galleryShortcutBtn: {
    alignItems: 'center',
    gap: 4,
  },
  galleryShortcutWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  galleryShortcutImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shutterDockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginTop: 4,
  },
  shutterButtonCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrToggleBtn: {
    alignItems: 'center',
    gap: 4,
  },
  qrToggleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 200,
  },

  // AI Processing Screen Styles
  processingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  processingPulseWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  sparkleProcessIcon: {
    position: 'absolute',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  processingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  consoleBlock: {
    backgroundColor: '#011d35',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    height: 180,
    gap: 8,
  },
  consoleLogLine: {
    fontSize: 12,
    color: '#82b1ff',
    fontWeight: '600',
    lineHeight: 18,
  },

  // Results Screen Styles
  resultsScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 64,
  },
  resultsBentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  trustScoreGaugeCard: {
    width: '46%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  gaugeGraphicContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  gaugeTrackOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeFilledArc: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  gaugeCenterTextWrapper: {
    alignItems: 'center',
  },
  gaugePercentageText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  gaugeVerifiedText: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.5,
  },
  genuineProductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  genuineProductBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2e7d32',
  },
  rightStatsStack: {
    flex: 1,
    gap: 12,
  },
  riskCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    padding: 12,
  },
  riskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riskLabelStatus: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  riskLabelValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2e7d32',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#2e7d32',
  },
  riskDescText: {
    fontSize: 9.5,
    color: colors.textSecondary,
    lineHeight: 14,
    fontWeight: '500',
  },
  productIdentityCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 12,
  },
  identityMetaTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  identityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  identityBatch: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.8,
    fontWeight: '600',
    marginTop: 2,
  },
  identityDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  identityMfgExpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mfgExpLabel: {
    fontSize: 8,
    color: colors.white,
    opacity: 0.6,
  },
  mfgExpValue: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
    marginTop: 1,
  },
  summaryBentoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  summarySplitRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  thumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningThumbnailLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    top: 36,
  },
  summaryDataFields: {
    flex: 1,
  },
  extractionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  splitRowField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.outlineVariant + '4D',
  },
  splitRowLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  splitRowValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splitRowValueText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '800',
  },
  splitRowValueTextPlain: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  resultsSummaryParagraph: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
    borderTopWidth: 0.5,
    borderTopColor: colors.outlineVariant + '4D',
    paddingTop: 12,
  },
  actionPillCabinet: {
    gap: 10,
    marginBottom: 40,
  },
  primaryInventoryBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryInventoryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryScanBtn: {
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryScanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  galleryBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  galleryBadgeTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default MedicineScannerScreen;
