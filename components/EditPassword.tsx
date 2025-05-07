import React, {useState} from 'react';
import {Modal, View, TextInput, Button, StyleSheet, Text, Alert} from 'react-native';
import ApiService from '@/services/ApiService';
import { saveTokens } from '@/services/AuthStorage';

const EditPassword = ({ visible, onClose, onSuccess }: any) => {
    const [loading, setLoading] = useState(false);
    const [actualPassword, setActualPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

    const handleAddRoute = async () => {
        try {
            setLoading(true);
            const response = await ApiService.patch('/user/me/update-password', {
                new: newPassword,
                old: actualPassword
            });
            saveTokens(response.tokens.access_token, response.tokens.refresh_token);
            onSuccess();
            onClose();
        } catch (err: any) {
            Alert.alert('Erreur lors de la modification du mot de passe', 'Code d\'erreur ' + err.status);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.label}>Mot de passe actuel</Text>
                    <TextInput secureTextEntry value={actualPassword} onChangeText={setActualPassword} style={styles.input} />

                    <Text style={styles.label}>Nouveau mot de passe</Text>
                    <TextInput secureTextEntry value={newPassword} onChangeText={setNewPassword} style={styles.input} />

                    <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                    <TextInput secureTextEntry value={newPasswordConfirm} onChangeText={setNewPasswordConfirm} style={styles.input} />

                    {
                        newPassword !== newPasswordConfirm && (
                            <Text style={styles.differentPasswords}>Mots de passe différents</Text>
                        )
                    }

                    <Button title="Ajouter" onPress={handleAddRoute} disabled={loading || (newPassword != newPasswordConfirm)} />
                    <Button title="Annuler" color="gray" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    content: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '85%' },
    label: { fontWeight: 'bold', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, paddingHorizontal: 10, height: 40 },
    differentPasswords: {color: 'red'}
});

export default EditPassword;
