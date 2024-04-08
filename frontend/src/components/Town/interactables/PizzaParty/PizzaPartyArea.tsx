import React, { useEffect, useState } from 'react';

import { useInteractableAreaController } from '../../../../classes/TownController';
import PizzaPartyAreaController from '../../../../classes/interactable/PizzaPartyAreaController';
import useTownController from '../../../../hooks/useTownController';
import { Customer, GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import PizzaPartyGame from './PizzaPartyGame';
import { useToast } from '@chakra-ui/react';
import PlayerController from '../../../../classes/PlayerController';
import LeaderBoard from './Leaderboard';

export default function PizzaPartyArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<PizzaPartyAreaController>(interactableID);
  const townController = useTownController();
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
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
      toast({
        title: 'Game over',
        description: `You lost :(`,
        status: 'error',
      });
    };
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameEnd', onGameEnd);
      gameAreaController.removeListener('gameUpdated', updateGameState);
    };
  }, [townController, gameAreaController, toast]);
  if (gameStatus !== 'IN_PROGRESS') {
    return (
      <div>
        <h1>Pizza Party Game</h1>
        <p>Waiting to start game</p>
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
          }}>
          Start Game
        </button>
      </div>
    );
  }
  if (gameStatus === "OVER") {
    return(
      <LeaderBoard />
    )
  }
  return (
    <div>
      <h1>Pizza Party Game</h1>
      <PizzaPartyGame gameAreaController={gameAreaController} />
    </div>
  );
}
