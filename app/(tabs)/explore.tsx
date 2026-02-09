import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Upload,
  CheckCircle,
  Clock,
  Trash2,
  HardDrive,
  Cpu
} from 'lucide-react-native';
import axios from 'axios';
import { Colors } from '@/constants/theme';
import { API_CONFIG } from '@/constants/Config';

interface UploadItem {
  uri: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id?: number;
}

export default function UplinkScreen() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newItems: UploadItem[] = result.assets.map(asset => ({
        uri: asset.uri,
        status: 'pending' as const
      }));
      setItems([...items, ...newItems]);
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const uploadAll = async () => {
    if (items.length === 0) return;
    setUploading(true);

    const pendingIndices = items
      .map((item, idx) => item.status === 'pending' ? idx : -1)
      .filter(idx => idx !== -1);

    for (const idx of pendingIndices) {
      const item = items[idx];

      const newItems = [...items];
      newItems[idx].status = 'uploading';
      setItems([...newItems]);

      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'ios' ? item.uri.replace('file://', '') : item.uri,
        name: `photo_${idx}.jpg`,
        type: 'image/jpeg',
      });
      formData.append('event_id', 'MOBILE_UPLINK');

      try {
        await axios.post(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        const successItems = [...items];
        successItems[idx].status = 'completed';
        setItems([...successItems]);
      } catch (e) {
        console.error(e);
        const errorItems = [...items];
        errorItems[idx].status = 'error';
        setItems([...errorItems]);
      }
    }

    setUploading(false);
  };

  const clearCompleted = () => {
    setItems(items.filter(item => item.status !== 'completed'));
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.background }]}>
      <LinearGradient
        colors={['rgba(168, 85, 247, 0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <HardDrive size={12} color={Colors.dark.secondary} />
            <Text style={[styles.badgeText, { color: Colors.dark.secondary }]}>SYSTEM STORAGE</Text>
          </View>
          <Text style={styles.title}>DATA{'\n'}UPLINK</Text>
          <Text style={styles.subtitle}>
            Ingest visual assets directly into the neural database cluster.
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.mainAction} onPress={pickImages} disabled={uploading}>
            <LinearGradient
              colors={[Colors.dark.primary, Colors.dark.secondary]}
              style={styles.gradientAction}
            >
              <Plus size={24} color="#fff" />
              <Text style={styles.actionText}>SELECT ASSETS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {items.length > 0 && (
          <View style={styles.queueStats}>
            <Text style={styles.queueLabel}>UPLINK QUEUE: {items.length} ITEMS</Text>
            <TouchableOpacity onPress={clearCompleted}>
              <Text style={styles.clearText}>PURGE LOGS</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.grid}>
          {items.map((item, index) => (
            <View key={index} style={styles.card}>
              <Image source={{ uri: item.uri }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                {item.status === 'pending' && (
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(index)}>
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                )}
                {item.status === 'uploading' && <ActivityIndicator color="#fff" />}
                {item.status === 'completed' && <CheckCircle size={24} color="#22d3ee" />}
                {item.status === 'error' && <Text style={styles.errorText}>FAILED</Text>}
              </View>
              {item.status === 'uploading' && <View style={styles.progressLine} />}
            </View>
          ))}
        </View>

        {items.some(i => i.status === 'pending') && (
          <TouchableOpacity
            style={[styles.uploadFab, uploading && { opacity: 0.5 }]}
            onPress={uploadAll}
            disabled={uploading}
          >
            <Upload size={24} color="#fff" />
            <Text style={styles.fabText}>DEPLOY TO CLUSTER</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  header: { marginBottom: 32 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
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
  actionRow: { marginBottom: 40 },
  mainAction: { borderRadius: 20, overflow: 'hidden', elevation: 10, shadowColor: '#818cf8', shadowRadius: 20, shadowOpacity: 0.3 },
  gradientAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  actionText: { color: '#fff', fontWeight: '900', letterSpacing: 2 },
  queueStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  queueLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  clearText: { color: Colors.dark.secondary, fontSize: 10, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: (Dimensions.get('window').width - 60) / 3, aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  removeBtn: { padding: 4 },
  errorText: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
  progressLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: Colors.dark.accent },
  uploadFab: {
    position: 'absolute',
    bottom: -80,
    left: 24,
    right: 24,
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: Colors.dark.primary,
    shadowRadius: 15,
    shadowOpacity: 0.5,
  },
  fabText: { color: '#fff', fontWeight: '900', letterSpacing: 1 }
});
