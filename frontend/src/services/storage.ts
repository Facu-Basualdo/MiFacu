import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_DATA_KEY = 'user_guest_data';

export const saveLocalData = async (key: string, data: any) => {
    try {
        const jsonValue = JSON.stringify(data);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error('Error saving local data:', e);
    }
};

export const getLocalData = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error reading local data:', e);
        return null;
    }
};

export const removeLocalData = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error('Error removing local data:', e);
    }
};
