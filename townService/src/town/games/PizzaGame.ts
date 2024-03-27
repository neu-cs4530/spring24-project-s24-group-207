import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  PizzaPartyGameState,
  PizzaPartyGameMove,
  GameMove,
  Order,
  Pizza,
  Topping,
  ToppingOptions,
  Customer,
} from '../../types/CoveyTownSocket';
import Game from './Game';

export default class PizzaPartyGame extends Game<PizzaPartyGameState, PizzaPartyGameMove> {
  public constructor() {
    super({
      status: 'WAITING_FOR_PLAYERS',
      currentScore: 0,
      ovenFull: false,
      currentCustomers: [],
      currentPizza: {
        id: 0,
        toppings: [],
        cooked: false,
      },
      difficulty: 1,
    });
  }

  public async applyMove(move: GameMove<PizzaPartyGameMove>): Promise<void> {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
  }

  public _join(player: Player): void {
    if (this.state.status !== 'WAITING_FOR_PLAYERS') {
      throw new Error(GAME_FULL_MESSAGE);
    }
    this.state.player = player.id;
    this.state.status = 'WAITING_TO_START';
  }

  /**
   * Sets up the player's departure for the game, which will then be finalized by the leave() method (see Game.ts).
   * This method resets the status to WAITING_FOR_PLAYERS before
   * @param player The player leaving the game.
   */
  public _leave(player: Player): void {
    if (!(player.id === this.state.player)) {
      throw new Error(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.status === 'IN_PROGRESS') {
      this.state.status = 'OVER';
    } else if (this.state.status === 'WAITING_TO_START') {
      this.state.status = 'WAITING_FOR_PLAYERS';
    }
    this.state.player = undefined;
  }

  /**
   * Starts the game for the given player. This method, unlike in ConnectFourArea, doesn't have an idea of player "readiness",
   * so the game simply starts if the player is in the game or if the game is startable. If this isn't the case, then it throws the respective error.
   *
   * @throws InvalidParametersError if game is not WAITING_TO_START (GAME_NOT_STARTABLE_MESSAGE).
   * @throws InvalidParametersError if the given player is not already in the game. (PLAYER_NOT_IN_GAME_MESSAGE).
   *
   * @param player The player this method starts the game on behalf of.
   */
  public startGame(player: Player): void {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_NOT_STARTABLE_MESSAGE);
    }
    if (!this.state.player) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      status: 'IN_PROGRESS',
    };
  }

  protected TOPPINGS_LIST: ToppingOptions[] = [
    'pepperoni',
    'mushrooms',
    'anchovies',
    'olives',
    'onions',
    'peppers',
    'sausage',
  ];

  protected getRandomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  protected generateRandomTopping = (): Topping => {
    const toppingKind = this.TOPPINGS_LIST[Math.floor(Math.random() * this.TOPPINGS_LIST.length)];
    return {
      id: Math.floor(Math.random() * 1000),
      kind: toppingKind,
      appliedOnPizza: false,
    };
  };

  protected generateRandomPizza = (): Pizza => {
    // Edited to be variable based on the game's difficulty.
    const numberOfToppings = this.getRandomInt(1, 2 * this.state.difficulty + 1);
    const toppings: Topping[] = [];
    for (let i = 0; i < numberOfToppings; i++) {
      const randomTopping: Topping = this.generateRandomTopping();
      toppings.push(randomTopping);
    }
    return {
      id: this.getRandomInt(0, 1000),
      toppings,
      cooked: false,
    };
  };

  protected generateRandomOrder = (): Order => {
    const numberOfPizzas = this.getRandomInt(1, this.state.difficulty);
    const pizzas: Pizza[] = [];
    for (let i = 0; i < numberOfPizzas; i++) {
      const randomPizza: Pizza = this.generateRandomPizza();
      pizzas.push(randomPizza);
    }
    return {
      pizzas,
      pointValue: this.getRandomInt(1, 10),
    };
  };

  protected generateRandomCustomer = (): Customer => {
    const customer: Customer = {
      id: this.getRandomInt(0, 1000),
      name: 'Customer',
      timeRemaining: 100 - 10 * (this.state.difficulty - 1),
      completed: false,
      order: this.generateRandomOrder(),
    };
    return customer;
  };
}
