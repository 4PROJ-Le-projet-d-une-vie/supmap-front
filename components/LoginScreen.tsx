import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
    const { login } = useAuth();
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!email || !password) return;
        login({ email, username: email.split('@')[0] }); // Auth fake
        navigation.navigate('Home');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Connexion</Text>
            <TextInput
                placeholder="Email"
                style={styles.input}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                placeholder="Mot de passe"
                style={styles.input}
                secureTextEntry
                onChangeText={setPassword}
            />
            <Button title="Se connecter" onPress={handleLogin} />
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                Pas encore de compte ? Inscris-toi
            </Text>
        </View>
    );
};

export default LoginScreen;

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
    link: {
        marginTop: 20,
        color: '#3b82f6',
        textAlign: 'center',
    },
});
