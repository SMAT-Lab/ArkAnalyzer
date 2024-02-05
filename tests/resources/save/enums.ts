enum Direction1 {
    Up = 1,
    Down,
    Left,
    Right
}

enum Direction2 {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}

enum BooleanLikeHeterogeneousEnum {
    No = 0,
    Yes = "YES",
}

enum E1 { X, Y, Z }

enum E2 {
    A = 1, B, C
}

enum FileAccess {
    // constant members
    None,
    Read    = 1 << 1,
    Write   = 1 << 2,
    ReadWrite  = Read | Write,
    // computed member
    G = "123".length
}

enum Response1 {
    No = 0,
    Yes = 1,
}

function respond(recipient: string, message: Response1): void {
    // ...
}

respond("Princess Caroline", Response1.Yes)

enum ShapeKind {
    Circle,
    Square,
}

interface Circle {
    kind: ShapeKind.Circle;
    radius: number;
}

interface Square {
    kind: ShapeKind.Square;
    sideLength: number;
}

let c: Circle = {
    kind: ShapeKind.Circle,
    radius: 100,
}

enum E {
    X, Y, Z
}

function f(obj: { X: number }) {
    return obj.X;
}

f(E);

enum Enum {
    A
}
let a2 = Enum.A;
let nameOfA = Enum[a2];

declare enum Enum {
    A1 = 1,
    B1,
    C1 = 2
}

const enum Directions {
    Up,
    Down,
    Left,
    Right
}

let directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right]