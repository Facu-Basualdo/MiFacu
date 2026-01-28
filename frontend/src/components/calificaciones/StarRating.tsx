import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
    readonly?: boolean;
    color?: string;
}

export function StarRating({
    value,
    onChange,
    size = 24,
    readonly = false,
    color = '#FFD700',
}: StarRatingProps) {
    const handlePress = (rating: number) => {
        if (readonly || !onChange) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(rating);
    };

    const renderStar = (index: number) => {
        const filled = index < value;
        const halfFilled = index === Math.floor(value) && value % 1 >= 0.5;

        let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (filled) {
            iconName = 'star';
        } else if (halfFilled) {
            iconName = 'star-half';
        }

        const star = (
            <Ionicons
                name={iconName}
                size={size}
                color={filled || halfFilled ? color : '#D1D1D6'}
            />
        );

        if (readonly) {
            return (
                <View key={index} style={styles.star}>
                    {star}
                </View>
            );
        }

        return (
            <TouchableOpacity
                key={index}
                onPress={() => handlePress(index + 1)}
                style={styles.star}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                activeOpacity={0.7}
            >
                {star}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {[0, 1, 2, 3, 4].map(renderStar)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        marginRight: 4,
    },
});
