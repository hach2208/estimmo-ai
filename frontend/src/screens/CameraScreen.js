/**
 * CameraScreen - Prise de photo du bien immobilier
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const COLORS = {
  primary: '#1E3A5F',
  white: '#FFFFFF',
  accent: '#E8B923',
};

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [location, setLocation] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(cameraStatus === 'granted');
      
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && !capturing) {
      setCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          exif: true,
        });

        if (!location) {
          Alert.alert(
            'Position requise',
            'Impossible de récupérer votre position GPS',
            [{ text: 'OK' }]
          );
          return;
        }

        navigation.navigate('Estimation', {
          images: [photo],
          location: location,
        });
      } catch (error) {
        console.error('Erreur capture:', error);
        Alert.alert('Erreur', 'Impossible de prendre la photo');
      } finally {
        setCapturing(false);
      }
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Accès à la caméra requis
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        {/* Guide de cadrage */}
        <View style={styles.overlay}>
          <View style={styles.guideFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          
          <Text style={styles.guideText}>
            Cadrez le bien immobilier
          </Text>
        </View>

        {/* Indicateur GPS */}
        <View style={styles.gpsIndicator}>
          <Ionicons 
            name={location ? "location" : "location-outline"} 
            size={20} 
            color={location ? COLORS.accent : '#fff'} 
          />
          <Text style={styles.gpsText}>
            {location ? 'GPS OK' : 'Localisation...'}
          </Text>
        </View>

        {/* Boutons */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.captureButton}
            onPress={takePicture}
            disabled={capturing || !location}
          >
            <View style={[
              styles.captureInner,
              capturing && styles.capturing
            ]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.flipButton}
            onPress={() => setType(
              type === CameraType.back 
                ? CameraType.front 
                : CameraType.back
            )}
          >
            <Ionicons name="camera-reverse" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.accent,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.accent,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gpsIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    gap: 6,
  },
  gpsText: {
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  capturing: {
    backgroundColor: COLORS.accent,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
