import {LatLng} from "react-native-maps";

export const getDistance = (a: LatLng, b: LatLng) => {
    const R = 6371e3;
    const phi1 = a.latitude * Math.PI / 180;
    const phi2 = b.latitude * Math.PI / 180;
    const deltaPhi = (b.latitude - a.latitude) * Math.PI / 180;
    const deltaLambda = (b.longitude - a.longitude) * Math.PI / 180;

    const x = deltaLambda * Math.cos((phi1 + phi2) / 2);
    const y = deltaPhi;
    return Math.sqrt(x * x + y * y) * R;
}

export const findClosestPolylineIndex = (polyline: any, location: any) => {
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