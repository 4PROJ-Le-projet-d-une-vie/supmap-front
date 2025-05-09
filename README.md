# Documentation technique frontend OVO


# Sommaire
1. [Choix des technologies](#choix-des-technologies)
2. [Authentification](#authentification)
3. [Communication avec l'API](#communication-avec-lapi)
4. [Structure écrans/components](#structure-des-écrans-et-components)
5. [Carte](#carte)
6. [Recalcul automatique des itinéraires](#recalcul-automatique-des-itinéraires)
7. [Démarrer et tester l'application](#démarrage)

## Choix des technologies

Les technologies choisies pour l'application OVO sont :
- React Native, framework Javascript adapté au développement mobile
- Expo, plateforme servant au développement, build et déploiement de l'application
- Axios, librairie NodeJS pour faire les appels d'API
- React Native Map, librairie permettant l'affichage et manipulation de la carte

## Authentification

L'authentification de l'utilisateur est gérée par deux écrans et 3 routes.
- LoginScreen, qui gère la connexion
- RegisterScreen, l'inscription
- ProfileScreen, qui affiche les données utilisateurs et possède un bouton pour se déconnecter

Afin de garder le token d'authentification retourné par les routes login et register nous utilisons la librairie Expo Secure Storage, permettant de stocker des données localement et de manière sécurisées. Les fonctions nécessaires à l'authentification sont regroupées dans un service AuthStorage.

## Communication avec l'API

Pour communiquer avec l'API nous utilisons la librairie Axios, librairie NodeJS permettant de faire des appels aux APIs HTTP.

Pour que le code soit plus clair dans les componenents, un fichier ApiService se chargera de toute la logique propre aux appels d'API. C'est à dire faire l'appel en lui même, gérer les erreurs, regénérer un access token si celui actuel est expiré.

Exemple d'utilisation :

- Dans le component :
```typescript
ApiService.get('/geocode', {address: text}).then((response) => {
    setSearchResults(response.data)
    setShowResults(true);
})
```
- Appelle la fonction dans le service :
```typescript
get: async (route: string, params?: any) => {
    const response = await api.get(route, { params });
    return response.data;
}
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


