import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import type { Dog } from '../../../shared/db/types';
import { DogCard } from './DogCard';

const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DISTANCE = 500;
const SWIPE_OUT_DURATION = 220;

export interface SwipeCardHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeCardProps {
  dog: Dog;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ dog, onSwipeLeft, onSwipeRight }, ref) => {
    const position = useRef(new Animated.ValueXY()).current;

    // The card's data-layer effect (recording the swipe) fires on its own timer rather than
    // waiting on the animation's completion callback -- animation frames can be throttled
    // (background tab, reduced-motion, low-end device), and swiping shouldn't be hostage to that.
    const animateOut = (direction: 'left' | 'right', onComplete: () => void) => {
      Animated.timing(position, {
        toValue: { x: direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start();
      setTimeout(onComplete, SWIPE_OUT_DURATION);
    };

    useImperativeHandle(ref, () => ({
      swipeLeft: () => animateOut('left', onSwipeLeft),
      swipeRight: () => animateOut('right', onSwipeRight),
    }));

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            animateOut('right', onSwipeRight);
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            animateOut('left', onSwipeLeft);
          } else {
            Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        },
      })
    ).current;

    const rotate = position.x.interpolate({
      inputRange: [-SWIPE_OUT_DISTANCE, 0, SWIPE_OUT_DISTANCE],
      outputRange: ['-15deg', '0deg', '15deg'],
    });

    return (
      <Animated.View
        style={[styles.container, { transform: [...position.getTranslateTransform(), { rotate }] }]}
        {...panResponder.panHandlers}
      >
        <DogCard dog={dog} />
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
