import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import {useNavigation} from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function CameraScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState<boolean>(false);
    const [qrData, setQrData] = useState<string | null>(null);
    const [isDetecting, setIsDetecting] = useState<boolean>(false);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const isValidCoordinatesArray = (data: string): boolean => {
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed.route)) return false;
            return parsed.route.every(
                (item: any) =>
                    typeof item === 'object' &&
                    typeof item.lat === 'number' &&
                    typeof item.lon === 'number'
            );
        } catch (e) {
            console.log(e);
            return false;
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (scanned) return;

        setIsDetecting(true);

        if (!isValidCoordinatesArray(data)) {
            Alert.alert('QR Code invalide', 'Les données doivent être un tableau avec latitude et longitude.');
            setIsDetecting(false);
            return;
        }
        setScanned(true);
        setQrData(data);
        navigation.navigate('Home', {scannedRoute: JSON.parse(data)})
    };

    const goBack = () => {
        navigation.navigate('Home')
    }


    if (hasPermission === null) return <Text>Demande de permission…</Text>;
    if (hasPermission === false) return <Text>Permission refusée</Text>;

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            >
                <TouchableOpacity onPress={goBack} style={styles.goBackButton}>
                    <MaterialIcons name={'arrow-back'} size={30} color={'rgba(87,69,138, 1)'}/>
                </TouchableOpacity>
                <View style={{position: 'absolute', top: 80, left: '18%', height: 50, width: 250, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center'}}>
                    <Text>Scannez le QR code disponible</Text>
                    <Text> sur le site web</Text>
                </View>
                {scanned && (
                    <View style={styles.scannedData}>
                        <Text>QR Code Scanné: {qrData}</Text>
                        <Text style={styles.reset} onPress={() => setScanned(false)}>
                            Scanner à nouveau
                        </Text>
                    </View>
                )}
                {isDetecting && (
                    <View style={styles.qrDetected}>
                        <Text style={styles.qrText}>QR détecté...</Text>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    scannedData: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -150 }, { translateY: -50 }],
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10,
        zIndex: 10,
    },
    reset: {
        marginTop: 10,
        color: 'blue',
        textDecorationLine: 'underline',
    },
    qrDetected: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 255, 0, 0.7)',
        padding: 10,
        borderRadius: 8,
        zIndex: 20,
    },
    qrText: {
        color: 'white',
        fontWeight: 'bold',
    },
    goBackButton: {
        backgroundColor: 'white',
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 10,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
