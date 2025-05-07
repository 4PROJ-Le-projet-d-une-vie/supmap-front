import React from "react";
import {FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View} from "react-native";
interface Props {
    searchResults: any[];
    handleClick: any
}

const SearchResultsList: React.FC<Props> = ({searchResults, handleClick}) => {
    const handleResultPress = async (item: any) => {
        Keyboard.dismiss();
        const destination = {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            name: item.display_name,
            type: 'break'
        };
        await handleClick([destination],item.display_name);
    };

    return (
        <View style={styles.resultContainer}>
            <FlatList
                data={searchResults}
                keyExtractor={(item, index) => item.place_id?.toString() ?? index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleResultPress(item)}
                        style={styles.resultItem}
                    >
                        <Text>{item.display_name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
};

export default SearchResultsList;

const styles = StyleSheet.create({
    resultContainer: {
        maxHeight: 200,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
        zIndex: 20,
        marginBottom: 10,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
});