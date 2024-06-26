import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import Player from '../../lib/Player';
import {
  PizzaPartyGameState,
  PizzaPartyGameMove,
  GameMove,
  TownEmitter,
  GameInstanceID,
} from '../../types/CoveyTownSocket';
import PizzaPartyGameArea from './PizzaGameArea';
import * as PizzaPartyGameModule from './PizzaGame';
import Game from './Game';
import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import { generateRandomTopping } from './PizzaGameHelpers';

class TestingGame extends Game<PizzaPartyGameState, PizzaPartyGameMove> {
  public constructor() {
    super({
      status: 'WAITING_TO_START',
      currentScore: 0,
      currentCustomers: [],
      currentPizza: {
        id: 0,
        toppings: [],
        cooked: false,
      },
      difficulty: 1,
      oven: {
        ovenFull: false,
      },
    });
  }

  public applyMove(move: GameMove<PizzaPartyGameMove>): void {}

  public endGame() {
    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }

  public startGame(player: Player) {}

  protected _join(player: Player): void {
    this._players.push(player);
  }

  protected _leave(player: Player): void {}
}
describe('ConnectFourGameArea', () => {
  let gameArea: PizzaPartyGameArea;
  let player1: Player;
  let player2: Player;
  let interactableUpdateSpy: jest.SpyInstance;
  const gameConstructorSpy = jest.spyOn(PizzaPartyGameModule, 'default');
  let game: TestingGame;

  beforeEach(() => {
    gameConstructorSpy.mockClear();
    game = new TestingGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
    gameArea = new PizzaPartyGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );

    // gameArea.add(red);
    // game.join(red);
    // gameArea.add(yellow);
    // game.join(yellow);
    gameArea.add(player1);
    game.join(player1);
    gameArea.add(player2);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');
  });

  describe('[T3.1] JoinGame command', () => {
    test('when there is no existing game, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
    });
    test('when there is a game that just ended, it should create a new game and call _emitAreaChanged', () => {
      expect(gameArea.game).toBeUndefined();

      gameConstructorSpy.mockClear();
      const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
      expect(gameArea.game).toBeDefined();
      expect(gameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
      game.endGame();

      gameConstructorSpy.mockClear();
      const { gameID: newGameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
      expect(gameArea.game).toBeDefined();
      expect(newGameID).toEqual(game.id);
      expect(interactableUpdateSpy).toHaveBeenCalled();
      expect(gameConstructorSpy).toHaveBeenCalledTimes(1);
    });
    describe('when there is a game in progress', () => {
      it('should call join on the game and call _emitAreaChanged', () => {
        const joinSpy = jest.spyOn(game, 'join');
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        expect(joinSpy).toHaveBeenCalledWith(player1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const joinSpy = jest.spyOn(game, 'join').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() => gameArea.handleCommand({ type: 'JoinGame' }, player2)).toThrowError(
          'Test Error',
        );
        expect(joinSpy).toHaveBeenCalledWith(player2);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });
  describe('[T3.2] StartGame command', () => {
    it('when there is no game, it should throw an error and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, player1),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });
    describe('when there is a game in progress', () => {
      it('should call startGame on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
        interactableUpdateSpy.mockClear();
        gameArea.handleCommand({ type: 'StartGame', gameID }, player1);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();

        const startSpy = jest.spyOn(game, 'startGame').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: game.id }, player1),
        ).toThrowError('Test Error');
        expect(startSpy).toHaveBeenCalledWith(player1);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      test('when the game ID mismatches, it should throw an error and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(() =>
          gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, player1),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
      });
    });
  });
  describe('[T3.4] LeaveGame command', () => {
    it('should throw an error if there is no game in progress and not call _emitAreaChanged', () => {
      expect(() =>
        gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player1),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });
    describe('when there is a game in progress', () => {
      it('should throw an error if the gameID does not match the game and not call _emitAreaChanged', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        interactableUpdateSpy.mockClear();
        expect(() =>
          gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player1),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      it('should call leave on the game and call _emitAreaChanged', () => {
        const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        const leaveSpy = jest.spyOn(game, 'leave');
        gameArea.handleCommand({ type: 'LeaveGame', gameID }, player1);
        expect(leaveSpy).toHaveBeenCalledWith(player1);
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player1);
        if (!game) {
          throw new Error('Game was not created by the first call to join');
        }
        interactableUpdateSpy.mockClear();
        const leaveSpy = jest.spyOn(game, 'leave').mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'LeaveGame', gameID: game.id }, player1),
        ).toThrowError('Test Error');
        expect(leaveSpy).toHaveBeenCalledWith(player1);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('[T3.3] GameMove command', () => {
    it('should throw an error if there is no game in progress and not call _emitAreaChanged', () => {
      interactableUpdateSpy.mockClear();

      expect(() =>
        gameArea.handleCommand(
          {
            type: 'GameMove',
            move: { topping: generateRandomTopping(), gamePiece: 'placeTopping' },
            gameID: nanoid(),
          },
          player1,
        ),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      expect(interactableUpdateSpy).not.toHaveBeenCalled();
    });
    describe('when there is a game in progress', () => {
      let gameID: GameInstanceID;
      beforeEach(() => {
        gameID = gameArea.handleCommand({ type: 'JoinGame' }, player1).gameID;
        interactableUpdateSpy.mockClear();
      });
      it('should throw an error if the gameID does not match the game and not call _emitAreaChanged', () => {
        expect(() =>
          gameArea.handleCommand(
            { type: 'GameMove', move: { col: 0, row: 0, gamePiece: 'Yellow' }, gameID: nanoid() },
            player1,
          ),
        ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
      });
      it('should call applyMove on the game and call _emitAreaChanged', () => {
        const move: PizzaPartyGameMove = {
          topping: generateRandomTopping(),
          gamePiece: 'placeTopping',
        };
        const applyMoveSpy = jest.spyOn(game, 'applyMove');
        gameArea.handleCommand({ type: 'GameMove', move, gameID }, player1);
        expect(applyMoveSpy).toHaveBeenCalledWith({
          gameID: game.id,
          playerID: player1.id,
          move: {
            ...move,
            gamePiece: 'placeTopping',
          },
        });
        expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      });
      it('should not call _emitAreaChanged if the game throws an error', () => {
        const move: PizzaPartyGameMove = { gamePiece: 'placeTopping' };
        const applyMoveSpy = jest.spyOn(game, 'applyMove');
        applyMoveSpy.mockImplementationOnce(() => {
          throw new Error('Test Error');
        });
        expect(() =>
          gameArea.handleCommand({ type: 'GameMove', move, gameID }, player1),
        ).toThrowError('Test Error');
        expect(applyMoveSpy).toHaveBeenCalledWith({
          gameID: game.id,
          playerID: player1.id,
          move: {
            ...move,
            gamePiece: 'placeTopping',
          },
        });
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
      // describe('when the game ends', () => {
      //   test('when the game state is over', () => {
      //     const finalMove: PizzaPartyGameMove = {
      //       gamePiece: 'placeTopping',
      //       topping: generateRandomTopping(),
      //     };
      //     jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
      //       game.state.currentScore += 25;
      //       game.endGame();
      //     });
      //     gameArea.handleCommand({ type: 'GameMove', move: finalMove, gameID }, player1);
      //     expect(game.state.status).toEqual('OVER');
      //     expect(gameArea.history.length).toEqual(1);
      //     expect(gameArea.history[0]).toEqual({
      //       gameID: game.id,
      //       scores: {
      //         [player1.userName]: 25,
      //       },
      //     });
      //     expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      //   });
      // });
    });
  });
  test('[T3.5] When given an invalid command it should throw an error', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing an invalid command, only possible at the boundary of the type system)
    expect(() => gameArea.handleCommand({ type: 'InvalidCommand' }, player1)).toThrowError(
      INVALID_COMMAND_MESSAGE,
    );
    expect(interactableUpdateSpy).not.toHaveBeenCalled();
  });
});
