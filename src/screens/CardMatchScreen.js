import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import PokemonTitle from '../components/PokemonTitle';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPokemonList } from '../api/client';
import { useApp } from '../context/AppContext';
import { getBoardLayout } from '../game/boardLayout';
import {
  DIFFICULTIES,
  createGame,
  getDifficulty,
  getStatus,
  hideCards,
  normalizePokemonList,
  pickCard,
} from '../game/cardMatch';

const FLIP_DURATION = 350;
const MISMATCH_DELAY = 800;
const GAP = 8;
const PADDING = 10;
const EMPTY_GAME = { cards: [], firstId: null, score: 0, strikes: 0, locked: false };

function FlipCard({ isFaceUp, sprite, name, width, height, onPress, duration }) {
  const flip = useRef(new Animated.Value(isFaceUp ? 180 : 0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(flip, {
      toValue: isFaceUp ? 180 : 0,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver,
    }).start();
  }, [duration, flip, isFaceUp, useNativeDriver]);

  const backRotation = flip.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const faceRotation = flip.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });
  // Swap faces at 90° so only one side is ever visible, even if the platform
  // ignores backfaceVisibility.
  const backOpacity = flip.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });
  const faceOpacity = flip.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  const nameSize = Math.max(8, Math.min(13, Math.round(width * 0.13)));

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={isFaceUp ? name : "Face-down card"} onPress={onPress} style={{ width, height }}>
      <Animated.View
        style={[
          styles.cardSide,
          { opacity: backOpacity, transform: [{ rotateY: backRotation }] },
        ]}
      >
        <Image accessible={false}
          source={require('../../assets/card-back.png')}
          style={styles.cardBackImage}
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.cardSide,
          styles.cardFace,
          { opacity: faceOpacity, transform: [{ rotateY: faceRotation }] },
        ]}
      >
        <Image accessible={false} source={{ uri: sprite }} style={styles.cardImage} />
        <View style={styles.namePill}>
          <Text numberOfLines={1} style={[styles.cardName, { fontSize: nameSize }]}>
            {name}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function CardMatchScreen() {
  const { defaultDifficulty, recordGame } = useApp();
  const [difficultyKey, setDifficultyKey] = useState(null);
  const difficulty = getDifficulty(difficultyKey ?? defaultDifficulty);
  const [pokemonPool, setPokemonPool] = useState([]);
  const [game, setGame] = useState(EMPTY_GAME);
  const [loading, setLoading] = useState(false);
  const [boardBox, setBoardBox] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const showBanner = windowHeight >= 600;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);
  const gameRef = useRef(EMPTY_GAME);
  const mismatchTimer = useRef(null);
  const recordedRef = useRef(false);

  const layout = boardBox
    ? getBoardLayout({
        width: boardBox.width,
        height: boardBox.height,
        count: difficulty.pairs * 2,
        gap: GAP,
        padding: PADDING,
      })
    : null;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const commit = useCallback((next) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const loadPokemon = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getPokemonList();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setPokemonPool(normalizePokemonList(Array.isArray(list) ? list : []));
    } catch (error) {
      Alert.alert(
        'Connection error',
        'Could not load Pokémon for the card match game.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPokemon();
    }, [loadPokemon])
  );

  const boardReady = Boolean(boardBox);
  const hasEnoughPokemon = pokemonPool.length >= difficulty.pairs;

  const startGame = useCallback(() => {
    clearTimeout(mismatchTimer.current);
    recordedRef.current = false;
    const columns = layoutRef.current?.columns ?? 3;
    const next =
      boardReady && hasEnoughPokemon
        ? createGame(pokemonPool, difficulty, Math.random, columns)
        : EMPTY_GAME;
    commit(next);
  }, [boardReady, commit, difficulty, hasEnoughPokemon, pokemonPool]);

  // Deal a fresh deck when the roster, difficulty or board becomes ready.
  // Resizing the window does not reset the game.
  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => () => clearTimeout(mismatchTimer.current), []);

  const status = getStatus(game);
  const isOver = status === 'won' || status === 'lost';
  // Wait for a mismatched pair to flip back before showing the result.
  const showResult = isOver && !game.locked;

  useEffect(() => {
    if (isOver && !recordedRef.current) {
      recordedRef.current = true;
      recordGame(difficulty.key, status, game.strikes, game.score);
    }
  }, [difficulty.key, game.score, game.strikes, isOver, recordGame, status]);

  function handleCardPress(cardId) {
    const result = pickCard(gameRef.current, cardId);

    if (result.action === 'ignored') {
      return;
    }

    commit(result.game);

    if (result.action === 'mismatch') {
      const ids = result.mismatchIds;
      clearTimeout(mismatchTimer.current);
      mismatchTimer.current = setTimeout(() => {
        commit(hideCards(gameRef.current, ids));
      }, MISMATCH_DELAY);
    }
  }

  const statusLine =
    status === 'won'
      ? 'You Won!'
      : status === 'lost'
        ? 'Game Over!'
        : 'Each pair is a score; each miss is a strike.';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.top}>
        {showBanner ? (
          <Image
            accessible={false}
            source={require('../../assets/banner.png')}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.titleRow}>
          <PokemonTitle accessibilityRole="header" style={styles.heroTitle}>
            Card Match
          </PokemonTitle>
          <Pressable accessibilityRole="button" accessibilityLabel="Start over" onPress={startGame} style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Over!</Text>
          </Pressable>
        </View>

        <Text
          style={[
            styles.statusText,
            status === 'won' && styles.wonText,
            status === 'lost' && styles.lostText,
          ]}
        >
          {statusLine}
        </Text>

        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((item) => {
            const active = item.key === difficulty.key;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${item.label} difficulty`} accessibilityState={{ selected: active }}
                key={item.key}
                onPress={() => setDifficultyKey(item.key)}
                style={[styles.difficultyChip, active && styles.difficultyChipActive]}
              >
                <Text style={[styles.difficultyText, active && styles.difficultyTextActive]}>
                  {item.label} · {item.pairs}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.statsRow} accessibilityLiveRegion="polite">
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>
              {game.score}/{difficulty.pairs}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Strikes</Text>
            <Text style={styles.statValue}>
              {game.strikes}/{difficulty.maxStrikes}
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#ffcb05" />
          <Text style={styles.loadingText}>Loading Pokémon roster...</Text>
        </View>
      ) : null}

      {!loading && !hasEnoughPokemon ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Add more Pokémon with sprites to your Pokédex before starting the{' '}
            {difficulty.label} board ({difficulty.pairs} pairs).
          </Text>
        </View>
      ) : null}

      <View
        style={styles.boardArea}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setBoardBox((previous) =>
            previous && previous.width === width && previous.height === height
              ? previous
              : { width, height }
          );
        }}
      >
        {layout ? (
          <ScrollView
            contentContainerStyle={[
              styles.board,
              { gap: GAP, paddingHorizontal: PADDING },
            ]}
          >
            {game.cards.map((card) => (
              <FlipCard
                key={card.id}
                isFaceUp={card.isFlipped || card.isMatched}
                duration={reduceMotion ? 0 : FLIP_DURATION}
                sprite={card.sprite}
                name={card.name}
                width={layout.cardWidth}
                height={layout.cardHeight}
                onPress={() => handleCardPress(card.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {status === 'won' ? 'You Won!' : 'Game Over'}
            </Text>
            <Text style={styles.modalText}>
              {status === 'won'
                ? `You matched all ${game.pairs} pairs with ${game.strikes} ${game.strikes === 1 ? 'strike' : 'strikes'}.`
                : `You used all ${game.maxStrikes} strikes and matched ${game.score} of ${game.pairs} pairs.`}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start a new game" onPress={startGame} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>New Game</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffcb05',
    borderRadius: 28,
    padding: 24,
    gap: 14,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#1e3a8a',
    fontSize: 30,
    fontWeight: '900',
  },
  modalText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  top: {
    paddingTop: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  banner: {
    width: '100%',
    height: 60,
    borderRadius: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  startButton: {
    backgroundColor: '#1d6fe0',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  statusText: {
    color: '#e6eeff',
    fontSize: 14,
    fontWeight: '700',
  },
  wonText: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
  },
  lostText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyChip: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#172c63',
    borderWidth: 2,
    borderColor: '#3b5ba8',
  },
  difficultyChipActive: {
    backgroundColor: '#facc15',
    borderColor: '#facc15',
  },
  difficultyText: {
    color: '#e6eeff',
    fontWeight: '800',
    fontSize: 13,
  },
  difficultyTextActive: {
    color: '#1f2937',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#172c63',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statLabel: {
    color: '#dbe7ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  warningCard: {
    marginHorizontal: 12,
    backgroundColor: '#fff7e0',
    borderRadius: 10,
    padding: 10,
  },
  warningText: {
    color: '#92400e',
    fontWeight: '700',
    lineHeight: 20,
  },
  boardArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: 8,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
    paddingBottom: 12,
  },
  cardSide: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffcb05',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardFace: {
    backgroundColor: '#c82335',
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  cardImage: {
    width: '100%',
    height: '84%',
    resizeMode: 'contain',
    marginBottom: 2,
  },
  namePill: {
    backgroundColor: '#541216',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  cardName: {
    textAlign: 'center',
    fontWeight: '900',
    color: '#ffffff',
  },
});
