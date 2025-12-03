/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <iostream>
using namespace std;

#define MARCO_THREE 3
#define GAME_SHOOTING 1
#define GAME_RACING   2

#define DIFFICULTY_EASY    1
#define DIFFICULTY_NORMAL  2
#define DIFFICULTY_HARD    3
#define TRACK_BEGINNER     1
#define TRACK_INTERMEDIATE 2
#define OPTION_ONE   1
#define OPTION_TWO   2
#define BASE_SCORE 100
#define CHOICE_ONE   1
#define CHOICE_TWO   2
#define CHOICE_THREE 3
#define INITIAL_COUNT 5
#define VALUE_ZERO   0
#define VALUE_ONE    1
#define CHAR_A      'A'
#define CHAR_B      'B'

enum NumConstant {
    ONE,
    TWO,
    THREE,
    FOUR,
    FIVE,
    SIX,
    TEN
};

void Case1()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
    }
}

void Case2()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO: {
            b = TWO;
        }
        case THREE: {
            b = THREE;
            break;
        }
        default:
            b = TEN;
    }
}

void Case3()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            switch (b) {
                case FOUR:
                    b = FOUR;
                case FIVE:
                    b = FIVE;
                default:
                    b = SIX;
            }
            break;
        default:
            b = TEN;
    }
}

void Case4()
{
    int b = ONE;
    for (int i = 0; i < THREE; ++i) {
        switch (i) {
            case TWO:
                b = TWO;
            case THREE:
                b = THREE;
                continue;
            default:
                b = TEN;
        }
        b = TEN;
    }
}

void Case5()
{
    int a = 0;
    int b = 1;
    switch (a) {
        default:
            b = TEN;
    }
    a = ONE;
}

void Case6()
{
    int a = 0;
    int b = 1;
    switch (a++) {
        case ONE:
            b = ONE;
            break;
        default:
            b = 0;
            break;
    }
}

void Case7()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
        case THREE:
            b = THREE;
            break;
        case FOUR:
            b = FOUR;
        default:
            b = TEN;
    }
}

void Case8()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
    }
}

void Case9()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
            break;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
}
void Case10()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
            break;
        default:
            b = 0;
            break;
    }
}

void Case11()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
        case THREE:
            b = THREE;
            break;
        default:
            // 空操作
    }
}

void Case12()
{
    int a = 0;
    int b = (a > ONE) ? TWO : MARCO_THREE;
    switch (a) {
        case TWO:
            b = TWO;
            break;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
}

void Case13()
{
    int a = 0;
    int b = 1;
    switch (a) {
        case TWO:
            b = TWO;
            break;
        case THREE:
            b = THREE;
            break;
        default:
            b = TEN;
            break;
    }
    if (a > ONE) {
        b = TWO;
    } else {
        b = THREE;
    }
}

void HandleGameSelection()
{
    int game = GAME_SHOOTING;
    int difficulty = DIFFICULTY_NORMAL;

    switch (game) {
        case GAME_SHOOTING:
            cout << "Shooting Game - ";
            cout << "Shooting Game2 - ";
            switch (difficulty) {
                case DIFFICULTY_EASY:
                    cout << "Easy Mode\n";
                    break;
                case DIFFICULTY_NORMAL:
                    cout << "Normal Mode\n";
                    break;
                case DIFFICULTY_HARD:
                    cout << "Hard Mode\n";
                    break;
            }
            break;

        case GAME_RACING:
            cout << "Racing Game - ";
            switch (difficulty) {
                case TRACK_BEGINNER:
                    cout << "Beginner Track\n";
                    break;
                case TRACK_INTERMEDIATE:
                    cout << "Intermediate Track\n";
                    break;
            }
            break;
        default:
            cout << "Invalid Game\n";
            break;
    }
}

void ProcessOptions()
{
    int option = OPTION_TWO;

    switch (int score = BASE_SCORE; option) {
        case OPTION_ONE:
            cout << "Option one, Score=" << score << endl;
            break;
        case OPTION_TWO:
            cout << "Option two, Score=" << score * OPTION_TWO << endl;
            break;
        default:
            cout << "Invalid Option\n";
            return;
    }
}

void ProcessChoice()
{
    int choice = CHOICE_TWO;

    switch (choice) {
        case CHOICE_ONE:
            cout << "Selected one\n";
            break;

        case CHOICE_TWO:
        {
            int count = INITIAL_COUNT;
            cout << "Selected two, Count=" << count << endl;
            break;
        }

        case CHOICE_THREE:
        {
            string message = "Hello";
            cout << message << " from case three\n";
            break;
        }
        default:
             cout << "Invalid Option\n";
             return;
    }
}

template<typename T>
void ProcessValue(T value)
{
    if constexpr (sizeof(T) == 4) {
        switch (value) {
            case VALUE_ZERO:
                cout << "Zero\n";
                break;
            case VALUE_ONE:
                cout << "One\n";
                break;
            default:
                cout << "Other Integer\n";
        }
    }
    else if constexpr (sizeof(T) == 1) {
        switch (value) {
            case CHAR_A:
                cout << "Letter A\n";
                break;
            case CHAR_B:
                cout << "Letter B\n";
                break;
            default:
                cout << "Other Character\n";
                return;
        }
    }
}

void TestConstexprSwitch()
{
    int num = VALUE_ONE;
    ProcessValue(num);

    char ch = CHAR_A;
    ProcessValue(ch);
}

int main()
{
    Case1();
    return 0;
}
