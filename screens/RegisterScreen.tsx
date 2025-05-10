import React, { useState } from 'react';
import {View, StyleSheet, Text, TextInput, Button, Alert, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from "@/services/ApiService";
import { saveTokens } from '@/services/AuthStorage'
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const RegisterScreen = () => {
    const { login } = useAuth();
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [handle, setHandle] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        if (!email || !handle || !password) return;
        ApiService.post('/register', {
            email: email,
            handle: handle,
            password: password
        }).then(async (response) => {
            await saveTokens(response.tokens.access_token, response.tokens.refresh_token);
            login({ email, handle: email.split('@')[0] });
            navigation.navigate('Home');
        }).catch((err) => {
            Alert.alert('Erreur lors de l\'inscription', 'Code d\'erreur ' + err.status);
        })
    };

    const goBack = () => {
        navigation.navigate('Login');
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={goBack} style={{top: -250}}>
                <MaterialIcons name={'arrow-back'} size={30} color={'rgba(87,69,138, 1)'}/>
            </TouchableOpacity>
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
                onChangeText={setHandle}
            />
            <TextInput
                placeholder="Mot de passe"
                style={styles.input}
                secureTextEntry
                onChangeText={setPassword}
            />
            <Button title="S'inscrire" color={'#57458A'} onPress={handleRegister} />
        </View>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20},
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        padding: 10,
        marginBottom: 15,
        borderRadius: 8,
    },
});
