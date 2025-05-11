# Documentation technique application mobile Supmap

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