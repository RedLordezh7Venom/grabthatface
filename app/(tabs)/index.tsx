import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  RefreshCw,
  Download,
  Search,
  Scan,
  Crosshair,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react-native';
import axios from 'axios';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/theme';
import { API_CONFIG } from '@/constants/Config';

const { width, height } = Dimensions.get('window');

interface Match {
  id: number;
  filename: string;
  filepath: string;
  event_id: string;
  timestamp: string;
}

export default function FindScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      await requestPermission();
      await MediaLibrary.requestPermissionsAsync();
    })();
  }, []);

  const captureAndSearch = async () => {
    if (!cameraRef.current) return;

    try {
      setScanning(true);
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      setPhoto(data.uri);
      await performSearch(data.uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to capture image');
      setScanning(false);
    }
  };

  const performSearch = async (uri: string) => {
    setLoading(true);
    setMatches([]);

    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: 'search.jpg',
      type: 'image/jpeg',
    });

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setMatches(response.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to Neural Backend');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const downloadImage = async (filename: string) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATIC}${filename}`;
    const fileUri = FileSystem.documentDirectory + filename;

    try {
      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
        await MediaLibrary.createAlbumAsync('GrabThatFace', asset, false);
        Alert.alert('Success', 'Image saved to gallery');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to download asset');
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera access to find your face.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Cpu size={12} color={Colors.dark.primary} />
            <Text style={styles.badgeText}>NEURAL NODE 01</Text>
          </View>
          <Text style={styles.title}>NEURAL{'\n'}RETRIEVAL</Text>
          <Text style={styles.subtitle}>
            Deploying 128-d Vision RAG to index your biometric signature.
          </Text>
        </View>

        <View style={styles.cameraWrapper}>
          {!photo ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              autofocus="on"
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />

                <View style={styles.scanTarget}>
                  <Crosshair size={40} color="rgba(129, 140, 248, 0.3)" />
                </View>

                {scanning && (
                  <LinearGradient
                    colors={['transparent', Colors.dark.primary, 'transparent']}
                    style={styles.scanBar}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                )}

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={captureAndSearch}
                  disabled={scanning}
                >
                  <View style={styles.captureButtonInner}>
                    <Camera size={32} color={Colors.dark.background} />
                  </View>
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View style={styles.camera}>
              <Image source={{ uri: photo }} style={styles.previewImage} />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.dark.primary} />
                  <Text style={styles.loadingText}>ANALYZING BIO-DATA...</Text>
                </View>
              )}
              {!loading && (
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => { setPhoto(null); setMatches([]); }}
                >
                  <RefreshCw size={20} color={Colors.dark.text} />
                  <Text style={styles.retakeText}>NEW ACQUISITION</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {photo && !loading && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>VERIFIED MATCHES</Text>
                <Text style={styles.resultsCount}>
                  {matches.length} BIOMETRIC OCCURRENCES
                </Text>
              </View>
              <Zap size={24} color={Colors.dark.primary} />
            </View>

            {matches.length > 0 ? (
              <View style={styles.resultsGrid}>
                {matches.map((item) => (
                  <View key={item.id} style={styles.matchCard}>
                    <Image
                      source={{ uri: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STATIC}${item.filename}` }}
                      style={styles.matchImage}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      style={styles.matchOverlay}
                    >
                      <View style={styles.matchInfo}>
                        <View style={styles.matchBadge}>
                          <ShieldCheck size={10} color={Colors.dark.primary} />
                          <Text style={styles.matchBadgeText}>BIOMETRIC OK</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.downloadBtn}
                          onPress={() => downloadImage(item.filename)}
                        >
                          <Download size={16} color={Colors.dark.background} />
                          <Text style={styles.downloadBtnText}>RAW</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Search size={48} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>Neural crawler completed search.{'\n'}No feature matches found.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 48,
    fontStyle: 'italic',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    marginTop: 12,
    lineHeight: 24,
    maxWidth: '80%',
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cornerTL: { position: 'absolute', top: 32, left: 32, width: 20, height: 2, backgroundColor: 'rgba(129, 140, 248, 0.5)' },
  cornerTR: { position: 'absolute', top: 32, right: 32, width: 20, height: 2, backgroundColor: 'rgba(129, 140, 248, 0.5)' },
  cornerBL: { position: 'absolute', bottom: 32, left: 32, width: 2, height: 20, backgroundColor: 'rgba(129, 140, 248, 0.5)' },
  cornerBR: { position: 'absolute', bottom: 32, right: 32, width: 2, height: 20, backgroundColor: 'rgba(129, 140, 248, 0.5)' },
  scanTarget: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    marginBottom: 20,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  retakeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  resultsSection: {
    marginTop: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 20,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    fontStyle: 'italic',
  },
  resultsCount: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  matchCard: {
    width: (width - 64) / 2,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  matchImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  matchInfo: {
    gap: 8,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchBadgeText: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: '900',
  },
  downloadBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  downloadBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
    opacity: 0.5,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  text: { color: '#fff', marginBottom: 20 },
  button: { backgroundColor: '#818cf8', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '900' }
});
