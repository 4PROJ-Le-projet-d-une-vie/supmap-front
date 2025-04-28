import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const RegisterScreen = () => {
    const { login } = useAuth();
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        if (!email || !username || !password) return;

        // Ici tu peux appeler ton backend pour enregistrer l'utilisateur
        login({ email, username }); // En attendant, on se connecte directement
        navigation.navigate('Home');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inscription</Text>
            <TextInput
                placeholder="Email"
                style={styles.input}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Nom d'utilisateur"
                style={styles.input}
                onChangeText={setUsername}
            />
            <TextInput
                placeholder="Mot de passe"
                style={styles.input}
                secureTextEntry
                onChangeText={setPassword}
            />
            <Button title="S'inscrire" onPress={handleRegister} />
        </View>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        padding: 10,
        marginBottom: 15,
        borderRadius: 8,
    },
});
