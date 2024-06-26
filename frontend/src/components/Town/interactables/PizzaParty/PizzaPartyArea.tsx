import React, { useEffect, useState } from 'react';

import { useInteractableAreaController } from '../../../../classes/TownController';
import PizzaPartyAreaController from '../../../../classes/interactable/PizzaPartyAreaController';
import useTownController from '../../../../hooks/useTownController';
import { Customer, GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import PizzaPartyGame from './PizzaPartyGame';
import { Button, useToast } from '@chakra-ui/react';
import PlayerController from '../../../../classes/PlayerController';
import LeaderBoard from './Leaderboard';
import * as client from './client';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import instructions from '../../../../../public/assets/pizza-party/instructions.png';

export default function PizzaPartyArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<PizzaPartyAreaController>(interactableID);
  const townController = useTownController();
  const [gameStatus, setGameStatus] = useState<GameStatus>('WAITING_FOR_PLAYERS');
  const [joiningGame, setJoiningGame] = useState(false);
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[] | undefined>(
    gameAreaController.currentCustomers,
  );
  const [score, setScore] = useState<number | undefined>(gameAreaController.currentScore);
  const [player, setPlayer] = useState<PlayerController | undefined>(gameAreaController.players[0]);
  useEffect(() => {
    const updateGameState = () => {
      setCustomers(gameAreaController.currentCustomers);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setScore(gameAreaController.currentScore);
      setPlayer(gameAreaController.players[0]);
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    const onGameEnd = () => {
      setGameStatus('OVER');
    };
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameEnd', onGameEnd);
      gameAreaController.removeListener('gameUpdated', updateGameState);
    };
  }, [townController, gameAreaController, toast]);
  if (gameStatus === 'WAITING_FOR_PLAYERS' || gameStatus === 'WAITING_TO_START') {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', rowGap: '10px' }}>
        <h1 style={{ color: 'maroon', fontSize: '30px' }}>Pizza Party Game</h1>
        <p style={{ fontWeight: 'bold' }}>Waiting to start game</p>
        <button
          onClick={async () => {
            setJoiningGame(true);
            try {
              await gameAreaController.joinGame();
              await gameAreaController.startGame();
            } catch (err) {
              toast({
                title: 'Error joining game',
                description: (err as Error).toString(),
                status: 'error',
              });
            }
            setJoiningGame(false);
          }}
          style={{
            backgroundColor: 'maroon',
            color: 'white',
            fontWeight: 'bold',
            padding: '5px',
            borderRadius: '5px',
          }}>
          Start Game
        </button>
        <Image
          src={'/assets/pizza-party/Instructions.png'}
          alt='Tutorial'
          width={500}
          height={400}
          unoptimized={true}
        />
      </div>
    );
  } else if (gameStatus === 'IN_PROGRESS') {
    return (
      <div>
        <h1>Pizza Party Game</h1>
        <div
          style={{
            position: 'absolute',
            top: 570,
            backgroundColor: 'beige',
            width: '100%',
            textAlign: 'center',
            padding: '20px',
            zIndex: 20,
          }}>
          <div style={{ marginBottom: '20px' }}>
            <h2>Player: {player?.userName}</h2>
            <h2>Score: {score}</h2>
          </div>
          <button
            style={{
              display: 'inline-block',
              backgroundColor: 'red',
              padding: '5px',
              borderRadius: '5px',
              color: 'white',
            }}
            onClick={async () => {
              await gameAreaController.endGame();
            }}>
            End Game
          </button>
        </div>
        <PizzaPartyGame gameAreaController={gameAreaController} />
      </div>
    );
  } else if (gameStatus === 'OVER') {
    return <LeaderBoard />;
  }
  return (
    <div>
      <h1>Pizza Party Game</h1>
      <div
        style={{
          position: 'absolute',
          top: 570,
          backgroundColor: 'beige',
          width: '100%',
          textAlign: 'center',
          padding: '20px',
          zIndex: 20,
        }}>
        <div style={{ marginBottom: '20px' }}>
          <h2>Player: {player?.userName}</h2>
          <h2>Score: {score}</h2>
        </div>
        <button
          style={{ display: 'inline-block', backgroundColor: 'red' }}
          onClick={async () => {
            await gameAreaController.endGame();
          }}>
          End Game
        </button>
      </div>
      <PizzaPartyGame gameAreaController={gameAreaController} />
    </div>
  );
}
