import React, { useState } from 'react';
import {View, StyleSheet, Text, TextInput, Button, Alert, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import ApiService from "@/services/ApiService";
import {saveTokens} from "@/services/AuthStorage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const LoginScreen = () => {
    const { login } = useAuth();
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if(!email || !password) return;
        let request = {password: password};
        request[email.startsWith('@') ? 'handle' : 'email'] = email;
        ApiService.post('/login', request).then(async (response) => {
            await saveTokens(response.access_token, response.refresh_token);
            login({ email, handle: email.split('@')[0] });
            navigation.navigate('Home');
        }).catch((err) => {
            console.log(err)
            if (err.status === 401) {
                Alert.alert('Nom d\'utilisateur ou mot de passe erronés.');
            } else Alert.alert('Erreur lors de la connexion', 'Code d\'erreur ' + err.status);
        })
    };

    const goBack = () => {
        navigation.navigate('Home');
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={goBack} style={{top: -250}}>
                <MaterialIcons name={'arrow-back'} size={30} color={'rgba(87,69,138, 1)'}/>
            </TouchableOpacity>
            <Text style={styles.title}>Connexion</Text>
            <TextInput
                placeholder="Email/Nom d'utilisateur"
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
            <Button title="Se connecter" color={'#57458A'} onPress={handleLogin} />
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                Pas encore de compte ? Inscris-toi
            </Text>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#aaa',
        padding: 10,
        marginBottom: 15,
        borderRadius: 8
    },
    link: {
        marginTop: 20,
        color: 'rgba(87,69,138, 1)',
        textAlign: 'center',
    },
});
