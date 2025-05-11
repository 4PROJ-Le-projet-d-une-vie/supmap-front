# Documentation technique application mobile Supmap


# Sommaire
1. [Choix des technologies](#choix-des-technologies)
2. [Structure du projet](#structure-du-projet)
3. [Authentification](#authentification)
4. [Communication avec l'API](#communication-avec-lapi)
5. [Structure écrans/components](#structure-des-écrans-et-components)
6. [Carte](#carte)
7. [Calcul de l'itinéraire](#calcul-de-litinéraire)
8. [Gestion des incidents](#gestion-des-incidents)
9. [Communication avec les WebSockets](#communication-avec-les-websockets)
10. [Récuperation d'itinéraire par QR Code](#récuperation-ditinéraire-par-qr-code)
11. [Démarrer et tester l'application](#démarrer-et-tester-lapplication)

## Choix des technologies

Les technologies choisies pour l'application Supmap sont :
- React Native, framework Javascript adapté au développement mobile
- Expo, plateforme servant au développement, build et déploiement de l'application
- Axios, librairie NodeJS pour faire les appels d'API
- React Native Map, librairie permettant l'affichage et manipulation de la carte

## Structure du projet
```
supmap-front/
├── app
    └──index.tsx         # Englobe toute l'application
├── assets/              # Contient toutes les polices d'écriture et images dont l'application a besoin
├── components/          # Contient les composants servant à construire l'application
├── constants/           # Données constantes servant à l'affichage
├── contexts/
    └── AuthContext.tsx  # Contient toute la logique d'authentification de React Native
├── navigation/
    └── Navigation.tsx   # Enregistre les différents écrans pour permettre de naviguer entre eux
├── screens/             # Contient les écrans navigables et construits à partir de composants
├── services/            # Contient une partie de la logique pour alléger les écrans et composants
└── README.md
```

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

```mermaid
sequenceDiagram
    participant User as Utilisateur (App mobile)
    participant Frontend as Application React Native
    participant Gateway as API Gateway
    participant API as Service API

    User ->> Frontend: Interactions utilisateur (ex: démarrer navigation, scanner QR)
    Frontend ->> Gateway: Requête HTTP/WS (ex: POST /route, GET /status)
    Gateway ->> API: Transmission de la requête au bon service (auth, route, incident)
    API -->> Gateway: Réponse (JSON, erreurs, données)
    Gateway -->> Frontend: Données consolidées
    Frontend -->> User: Affichage des infos (itinéraire, instructions, incidents)
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

## Calcul de l'itinéraire
Voici le process complet pour calculer l’itinéraire et l’afficher sur l’application :

- L’utilisateur tape sa recherche dans une barre de recherche, ce qui va faire un appel au service supmap gis qui va lui même renvoyer des données GPS trouvées par Nominatim.
```typescript
<View style={styles.searchContainer} pointerEvents="box-none"> 
    {showResults && searchResults.length > 0 && (
        <SearchResultsList searchResults={searchResults} handleClick={fetchRoute} />
    )}

   <View style={styles.searchBarContainer}>
      <View style={styles.searchBar}>
         <Ionicons name="search" size={20} color="black" />
         <TextInput placeholder="Où allons-nous ?" value={searchText}
            onChangeText={(text) => {
               setSearchText(text);
               fetchSearchResults(text);
            }}
            style={styles.searchInput}
         />
      </View>
   </View>
</View>

const fetchSearchResults = (text: string) => {
   if(text === '') {
      setSearchResults([])
      setShowResults(false);
   } else {
      ApiService.get('/geocode', {address: text}).then((response) => {
         setSearchResults(response.data)
         setShowResults(true);
      })
   }
}
```

- Les résultats s’affichent dans une liste, ce qui donne la possibilité à l’utilisateur de cliquer sur un des résultats proposés pour faire un appel d’API encore une fois à supmap gis avec les coordonnées GPS nécessaires pour former un trajet, cette fois-ci fourni par Valhalla.

Choix destination :
```typescript
<View style={styles.resultContainer}>
    <FlatList
        data={searchResults}
        keyExtractor={(item, index) => item.place_id?.toString() ?? index.toString()}
        renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleResultPress(item)} style={styles.resultItem}>
                <Text>{item.display_name}</Text>
            </TouchableOpacity>
        )}
    />
</View>

const handleResultPress = async (item: any) => {
   Keyboard.dismiss();
   const destination = {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      name: item.display_name,
      type: 'break'
   };
   await fetchRoute([destination],item.display_name);
};
```
Requête à supmap gis et navigation sur la page de choix d’itinéraires, trois au maximum :
```typescript
const fetchRoute = async (destination: any, displayName: string|null) => {
   if (!location) return;
   if (displayName) setSearchText(displayName)
   let points = [{lat: location.latitude, lon: location.longitude, name: 'Votre position', type: 'break'}]
   points = points.concat(destination);
   let request = {
      costing: "auto",
      costing_options: {
         use_tolls: avoidTolls ? 0 : 1
      },
      locations: points
   }
   setLoading(true);
   try {
      ApiService.post('/route', request).then((response) => {
         navigation.navigate('RouteChoice', {routes: response.data, searchText: searchText});
      })
   } catch (error) {
      Alert.alert("Erreur lors de la récupération de l'itinéraire", error);
   }
   setLoading(false);
};
```

- L’utilisateur peut choisir parmi 3 itinéraires (maximum) différents, ces itinéraires sont affichés avec le temps du trajet et la distance en kilomètres, afin que l’utilisateur puisse choisir ce qu’il préfère entre peu de distance ou un trajet plus rapide. Une fois que le trajet est choisi, l’application navigue de nouveau sur la page de la carte et affiche les instructions de navigation, avec un léger traitement au niveau des instructions et de la “shape”, ou polyline, afin de gérer les cas avec plusieurs destinations, qui sont dans des objets distincts.

```typescript
<View style={styles.container}>
    <Text style={styles.title}>Choisissez votre itinéraire</Text>
    <FlatList
      data={routes}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
              <Text style={styles.label}>Itinéraire {item.locations[item.locations.length - 1].name}</Text>
              <Text>Temps : {Math.round(item.summary.time / 60)} min</Text>
              <Text>Distance : {(item.summary.length).toFixed(2)} km</Text>
          </TouchableOpacity>
      )}
    />
    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <MaterialIcons name={'cancel'} color={'rgba(87,69,138, 1)'} size={30} />
    </TouchableOpacity>
</View>

const handleSelect = (selectedRoute) => {
    let completeShape: any[] = [];
    let completeInstructions: any[] = []
    for(let leg of selectedRoute.legs) {
        completeShape = completeShape.concat(leg.shape);
        completeInstructions = completeInstructions.concat(leg.maneuvers);
    }
    selectedRoute.completeShape = completeShape;
    selectedRoute.completeInstructions = completeInstructions;
    navigation.navigate('Home', { selectedRoute: selectedRoute });
};
```

- Affichage des instructions sur la page, avec le temps et distance restante s’actualisant en temps réel.

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

Lorsque l'utilisateur se déplace, l'application vérifie automatiquement s'il se rapproche d'un incident. S'il y en a un à moins de 100 mètres, celle-ci ouvre un message demandant à l'utilisateur de confirmer si l'incident est toujours en cours.

```typescript
//Extrait du code s'exécutant à chaque mouvement de l'utilisateur
for(let i = 0; i < incidents.length; i++) {
   let incidentLatLon = {
      latitude: incidents[i].lat,
      longitude: incidents[i].lon,
   }

   if(getDistance(userPosition, incidentLatLon) < 100 && !alreadyVotedIncidentsIds.includes(incidents[i].id)) {
      setAlreadyVotedIncidentsIds([...incidents, incidents[i].id]);
      setApproachingIncident(incidents[i])
   }
}

<Modal visible={polyline && approachingIncident !== null && isAuthenticated && userId && approachingIncident.user.id !== userId} transparent animationType="slide">
   <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{approachingIncident?.type.name} toujours en cours ?</Text>
         <View style={{display: 'flex', flexDirection: 'row'}}>
            <TouchableOpacity style={[styles.incidentInteractionButton, {backgroundColor: 'rgba(87,69,138, 1)'}]} onPress={upvoteIncident}>
                <Text style={styles.incidentInteractionButtonText}>Oui</Text>
            </TouchableOpacity>
            <View style={{width: 50}}></View>
            <TouchableOpacity style={[styles.incidentInteractionButton, {backgroundColor: 'grey'}]} onPress={downvoteIncident}>
                <Text style={styles.incidentInteractionButtonText}>Non</Text>
            </TouchableOpacity>
         </View>
      </View>
   </View>
</Modal>

const upvoteIncident = () => {
   ApiService.post('/incidents/interactions', {incident_id: approachingIncident.id, is_still_present: true}).finally(() => updateIncidents());
}
const downvoteIncident = () => {
   ApiService.post('/incidents/interactions', {incident_id: approachingIncident.id, is_still_present: false}).finally(() => updateIncidents());
}

const updateIncidents = () => {
   let updatedIncidents = incidents;
   for (let i = 0; i < updatedIncidents.length; i++) {
      if(updatedIncidents[i].id == approachingIncident.id) {
         updatedIncidents[i].alreadyVoted = true;
         break;
      }
   }
   setApproachingIncident(null);
}
```

Le système de "vote" des incidents permet d'ensuite les certifier afin de les prendre en compte dans le calcul des itinéraires par l'API.


## Communication avec les WebSockets

L'application met en place une communication avec un WebSocket afin d'obtenir certaines données en temps réel, notamment les incidents ou le recalcul d'un itinéraire suite à une erreur de l'utilisateur.

Diagramme de séquence sur le comportement de l'application :

```mermaid
sequenceDiagram
    participant Frontend as Frontend (React Native App)
    participant Gateway as Gateway (supmap-gateway)
    participant WebSocketServer as WebSocket Server (supmap-navigation)

    Frontend->>Gateway: HTTP GET /ws\n(Upgrade: websocket)
    Gateway->>WebSocketServer: Proxy Upgrade request
    WebSocketServer-->>Gateway: HTTP 101 Switching Protocols
    Gateway-->>Frontend: HTTP 101 Switching Protocols

    loop Every 5s
        Frontend->>WebSocketServer: JSON.stringify({ type: "position", data: { lat, lon, timestamp } })
        WebSocketServer-->>Frontend: Ack / response (optional)
    end

    Frontend--x WebSocketServer: Disconnect / App Close
```
Mise en place du WebSocket et gestion des réponses selon leurs types, incident pour ajouter un nouvel incident, route pour mettre à jour l'itinéraire :
```typescript
useEffect(() => {
    setUuid().then(() => {
        getItemAsync('webSocketUid').then(uuid => {
            ws.current = new WebSocket(API_BASE_URL + "/navigation/ws?session_id=" + uuid );

            ws.current.onmessage = (e) => {
                if(e.type == "incident") handleIncidentWebsocket(e.data)
                if(e.type == "route") handleRouteWebsocket(e.data)
            };

            return () => {
                ws.current?.close();
            };
        })
    })
}, []);
```

Envoie de position toutes les 5 secondes :
```typescript
setInterval(() => {
    if (ws.current?.readyState == WebSocket.OPEN && route && route.params && route.params.selectedRoute && location && location.latitude && location.longitude) {
        let message = {
            type: "position",
            data: {
                "lat": location.latitude,
                "lon": location.longitude,
                "timestamp": Date.now()
            }
        }
        ws.current.send(JSON.stringify(message));
    }
}, 3000)
```

# Récuperation d'itinéraire par QR Code

L'application permet de scanner un QR Code généré par l'application web, puis ajouter l'itinéraire contenu dans celui-ci à ceux sauvegardés par l'utilisateur.

L'écran contenant le scan de QR Code faisant une navigation sur celui de la carte, avec un paramètre précis éxecutant une requête HTTP dès l'ouverture de celui-ci.
```typescript
<CameraView style={styles.camera} onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{barcodeTypes: ['qr'],}}>
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
```

## Démarrer et tester l'application

1. Installer les dépendances

   ```bash
   npm install
   ```
2. Créer un compte Expo Go sur https://expo.dev/signup
3. Se connecter en utilisant la commande
    ```bash
    npx expo login -u YOUR_USERNAME -p YOUR_PASSWORD 
   ```
4. Démarrer le serveur expo

   ```bash
    npx expo start -c
   ```
   Une fois le serveur démarré vous allez voir un QR Code avec une adresse IP en dessous, copiez la
    ```bash
    › Metro waiting on exp://*votre-ip*:8081
   ```

5. Fournir les variables d'environnement

   L'application n'a besoin que d'une seule variable d'environnement, le fichier .env est donc sous cette forme :

    ```.dotenv
    EXPO_PUBLIC_API_URL=http://*votre ip*:9000
    // Port 9000 étant celui de la gateway
   ```
6. Redémarrer le serveur expo pour qu'il prenne bien en compte la modification d'environnement, toujours avec la commande

   ```bash
    npx expo start -c
   ```
7. Utilisez une de ces options pour lancer l'application
   Pour tester l'application voici les différentes options :

- [Émulateur Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulateur iOS (seulement sur Mac)](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go?sdkVersion=52&platform=android&device=true), application mobile servant à tester l'application directement sur votre appareil en scannant le QR code donné par la commande "npx expo start", veillez à bien être connecté au même réseau que l'ordinateur hébergeant le serveur et posséder l'application supportant le SDK 52 (Le lien de téléchargement fourni dirige vers une version Android supportant le SDK 52)

Nous recommandons d'utiliser Expo Go dans une environnement de développement.