# Documentation technique application mobile Supmap


# Sommaire
1. [Choix des technologies](#choix-des-technologies)
2. [Authentification](#authentification)
3. [Communication avec l'API](#communication-avec-lapi)
4. [Structure écrans/components](#structure-des-écrans-et-components)
5. [Carte](#carte)
6. [Recalcul automatique des itinéraires](#recalcul-automatique-des-itinéraires)
7. [Démarrer et tester l'application](#démarrage)

## Choix des technologies

Les technologies choisies pour l'application Supmap sont :
- React Native, framework Javascript adapté au développement mobile
- Expo, plateforme servant au développement, build et déploiement de l'application
- Axios, librairie NodeJS pour faire les appels d'API
- React Native Map, librairie permettant l'affichage et manipulation de la carte

## Authentification

L'authentification de l'utilisateur est gérée par deux écrans et 3 routes.
- LoginScreen, qui gère la connexion
- RegisterScreen, l'inscription
- ProfileScreen, qui affiche les données utilisateurs et possède un bouton pour se déconnecter

React Native possède également ce qu’il appelle un “AuthContext”, possédant une classe User personnalisable et des fonctions permettant de gérer l’utilisateur dans l’application :
login(), permettant de transmettre l’information qu’un utilisateur est connecté
logout(), permettant de transmettre l’information que l’utilisateur s’est déconnecté

Ces deux fonctions sont importantes car elles définissent l’état de la variable isAuthenticated, utilisé comme son nom l’indique pour savoir si un utilisateur est connecté ou non sur l’application, et donc savoir quel comportement avoir.
```typescript
//Login 
let request = {password: password};
request[email.startsWith('@') ? 'handle' : 'email'] = email;
ApiService.post('/login', request).then(async (response) => {
   await saveTokens(response.access_token, response.refresh_token);
   login({ email, handle: email.split('@')[0] });
   navigation.navigate('Home');
})

//Register
ApiService.post('/register', {
   email: email,
   handle: handle,
   password: password
}).then(async (response) => {
   await saveTokens(response.tokens.access_token, response.tokens.refresh_token);
   login({ email, handle: email.split('@')[0] });
   navigation.navigate('Home');
})
//Logout
logout()
ApiService.post('/logout', {token: getRefreshToken()}).then(async () => {
   await clearTokens()
   navigation.navigate('Home');
})
```
Afin de garder le token d'authentification retourné par les routes login et register, nous utilisons la librairie Expo Secure Storage, permettant de stocker des données localement et de manière sécurisée. Les fonctions nécessaires à l'authentification sont regroupées dans un service AuthStorage.
```typescript
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const saveTokens = async (accessToken: string, refreshToken?: string) => {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};
```

## Communication avec l'API
Pour communiquer avec l'API nous utilisons la librairie Axios, librairie Node JS permettant de faire des appels aux APIs HTTP.

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import {getAccessToken, getRefreshToken, saveTokens} from './AuthStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

const ApiService = {
    get: async (route: string, params?: any) => {
        const response = await api.get(route, { params });
        return response.data;
    },

    post: async (route: string, data?: any) => {
        const response = await api.post(route, data);
        return response.data;
    },

    patch: async (route: string, data?: any) => {
        const response = await api.patch(route, data);
        return response.data;
    },

    delete: async (route: string) => {
        const response = await api.delete(route);
        return response.data;
    },
};

export default ApiService;
```

Pour que le code soit plus clair dans les components, un fichier ApiService se chargera de toute la logique propre aux appels d'API. C'est-à-dire faire l'appel en lui-même, gérer les erreurs, régénérer un access token si celui actuel est expiré.

Le code ci-dessous permet d’intercepter les erreurs renvoyées par l’API, et si celle-ci correspond à un code 401, qui correspond à un token périmé, elle va faire un appel à la route “/refresh” pour en récupérer un nouveau, et exécuter l’appel ayant échoué.
```typescript
api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDY2OTY5NzksImlhdCI6MTc0NjYxMDU3OSwicm9sZSI6IlJPTEVfVVNFUiIsInVzZXJJZCI6MX0.yxJ1BE_BcabWmj4cC_CZhxcyKrqPYegd5HemQrvGBt0`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await getRefreshToken();
                const refreshResponse = await axios.post(`${API_BASE_URL}/refresh`, {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token } = refreshResponse.data;

                await saveTokens(access_token, refresh_token);

                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${access_token}`,
                };

                return api(originalRequest);
            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                throw refreshError;
            }
        }

        return Promise.reject(error);
    }
);
```

## Structure des écrans et components

Les écrans et components sont ce qui servent à définir l'apparence de l'application. Ils sont structurés de cette manière :
- Props, des variables qu'un component ou écran parent/précedent peut donner à celui-ci pour y avoir accès, exemple :
```typescript
interface Props {
    instruction: any | null;
}

const RouteInstructions: React.FC<Props> = ({ instruction }) => {
    // code
}
```

- Variable/useState, les variables en React se définissent comme un état et se servent d'une méthode associée pour être modifiées, exemple :
```typescript
const [location, setLocation] = useState(null);
const [region, setRegion] = useState(null);
```

- Fonctions, les fonctions sont définies comme des constantes ayant pour valeur une fonction, exemple :
```typescript
const findClosestPolylineIndex = () => {
    let minDistance = Infinity;
    let closestIndex = 0;
    polyline.forEach((point: any, index: any) => {
        const distance = getDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: point.latitude, longitude: point.longitude }
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}
```

- "Retour", le retour de la fonction définissant l'écran ou componant est la partie où on va former sa structure grâce à des balises semblables à du HTML, on utilise des accolades ({}) pour insérer du code dans les balises, exemple complet :
```typescript
<View style={styles.container}>
    <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text style={styles.instruction}>{instruction.street_names.length ? instruction.street_names.join(', ') : instruction.instruction}</Text>
        <View>
        <MaterialIcons style={{marginBottom: -50}} name={instructionsIcons[instruction.type]} size={70} color={'white'}/>
        <Text style={styles.instructionDistance}> {instruction.distanceTo < 1000 ? instruction.distanceTo.toFixed(0) + 'm' : (instruction.distanceTo/1000).toFixed(2) + 'km'}</Text>
        </View>
    </View>
    <Text style={styles.informationText}>
        {instruction.arrivalTime}
        &nbsp; &#11044; &nbsp;
        {(instruction.remainingDistance / 1000).toFixed(0)} km
        &nbsp; &#11044; &nbsp;
        {(instruction.remainingDuration < 3600 ? instruction.remainingDuration / 60 : instruction.remainingDuration / 3600).toFixed(0)} min
    </Text>
</View>
```

- Styles, le style de l'écran ou components se définit en dehors du code de celui-ci, exemple :
```typescript
const RouteInstructions: React.FC<Props> = ({ instruction }) => {
    //code
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(87,69,138, 1)',
        padding: 15,
        minHeight: 130,
        width: '100%',
    },
});
```

## Carte

Pour afficher la carte et tout ce qui y est lié, c'est à dire les markers d'incidents, départ et arrivé, ainsi que le tracé du trajet, nous nous servons de la librairie React Native Map. 

La carte se définit comme ceci dans le code :
```typescript
<MapView
   customMapStyle={mapDesign}
   ref={mapRef}
   style={styles.map}
   initialRegion={region}
   showsUserLocation
>
```
- customMapStyle permet d'appliquer un design personnalisé à la carte
- ref permet d'appliquer plusieurs paramètres à la carte, notamment le fait de suivre l'utilisateur lorsqu'il se déplace
- initialRegion sert à définir la position de base sur la carte au lancement de l'application
- showUserLocation sert à faire ce que son nom indique, soit afficher la position de l'utilisateur

Les Polylines, ou tracés, se définissent comme ceci :
```typescript
<Polyline coordinates={polyline} strokeWidth={5} strokeColor="blue" />
```
- coordinates attend un tableau d'objets sous la forme ci-dessous, à partir de ceci la ligne se dessine sur la carte
```json
{"latitude": number, "longitude": number}
```
- strokeWidth permet de définir la largeur de la ligne
- strokeColor permet de définir la couleur de la ligne

Les Markers, ou points sur la carte se définissent comme ceci :
```typescript
<Marker
    key={index}
    coordinate={{ latitude: location.lat, longitude: location.lon }}
    title={location.name ? location.name : `Étape ${index + 1}`}
    pinColor={index === 0 ? 'green' : index === route.params.selectedRoute.locations.length - 1 ? 'red' : 'blue'}
/>
```
- key sert à donner un identifiant au marker
- coordinate sert à définir l'emplacement du marker
- title sert à définir quel texte sera afficher lorsque l'utilisateur cliquera sur le marker
- pinColor définit la couleur du marker

## Recalcul automatique des itinéraires

## Gestion des incidents

Voici comment la gestion des incidents est faites dans notre application :

- Dès le lancement, l’application va récupérer les types d’incidents et les incidents  eux-mêmes dans un rayon de 500 mètres, puis les afficher sur la map, après cela ils ne seront rafraîchis que toutes les 5 minutes.

```typescript
if(!initialLoaded) {
  ApiService.get('/incidents/types').then(response => {
      setIncidentTypes(response);
      ApiService.get('/incidents', {lat: loc.coords.latitude, lon: loc.coords.longitude, radius: 500}).then(response => {
          setIncidents(response);
          setInitialLoaded(true);
      })
  })
}

{incidents.map((incident: any) => (
  <Marker
      key={incident.id}
      coordinate={{ latitude: incident.lat, longitude: incident.lon }}
      title={incident.type.name}
  >
      <View style={{backgroundColor: incidentsDesign[incident.type.id].color, borderRadius: 10, paddingRight: 5, paddingVertical: 5, height: '100%'}}>
          <Text style={{marginLeft: 5}}>{incidentsDesign[incident.type.id].icon}</Text>
      </View>
  </Marker>
))}
```
- Lorsque l’utilisateur entrera en navigation, il aura accès à un bouton pour en signaler lui même, ouvrant une liste des types d’incidents recueillis par l’appel d’API

```typescript
{instructions.length > 0  && (
  <TouchableOpacity style={styles.incidentButton} onPress={() => setShowIncidentModal(true)}>
      <Image style={{resizeMode: 'stretch', height: 40, width: 40, top: 7, left: 7}} source={require('../assets/images/incidentAddButton.png')}/>
  </TouchableOpacity>
)}

<Modal visible={showIncidentModal} transparent animationType="slide">
  <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sélectionnez un incident</Text>
          {incidentTypes.map((type) => (
              <TouchableOpacity key={type.id} style={{padding: 12, backgroundColor: incidentsDesign[type.id].color, marginVertical: 5, borderRadius: 8}} onPress={() => reportIncident(type)}>
                  <Text>{type.name} {incidentsDesign[type.id].icon}</Text>
              </TouchableOpacity>
          ))}
          <Button title="Annuler" onPress={() => setShowIncidentModal(false)} />
      </View>
  </View>
</Modal>

const reportIncident = (incidentType: any) => {
  const request = {
      lat: location.latitude,
      lon: location.longitude,
      type_id: incidentType.id,
  }
  ApiService.post('/incidents', request).then(response => {
      setShowIncidentModal(false);
      setIncidents([...incidents, response]);
  })
}
```

## Démarrage

1. Installer les dépendances

   ```bash
   npm install
   ```

2. Démarrer le serveur expo

   ```bash
    npx expo start
   ```

Pour tester l'application voici les différentes options :

- [Build de développement](https://docs.expo.dev/develop/development-builds/introduction/)
- [Émulateur Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulateur iOS (seulement sur Mac)](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), application mobile servant à tester l'application directement sur votre appareil en scannant le QR code donné par la commande "npx expo start"


