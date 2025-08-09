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
#include <vector>
#include <set>
#include <map>
#include <unordered_map>
#include <queue>
#include <deque>
#include <stack>
#include <list>

using namespace std;

#define ONE 1
#define TWO 2
#define THREE 3
#define FIVE 5
#define SIX 6
#define TEN 10
#define TWENTY 20
#define THIRTY 30
#define TWENTY_FIVE 25
#define THIRTY_FIVE 35

// vector
void VectorTest()
{
    std::vector<int> vec1 = {1, 2, 3, 4, 5};
    int men = vec1[TWO];
    std::cout << "vec1[2]" << men << std::endl;
    vec1[TWO] = SIX;
    std::cout << vec1[TWO] << std::endl;
    std::cout << vec1.back() << std::endl;

    std::vector<int> vec2;
    vec2.push_back(TEN);
    vec2.push_back(TWENTY);
    vec2.push_back(THIRTY);
    std::cout << "size is" << vec2.size() << "success" << std::endl;
    vec2.pop_back();
    std::cout << vec2.size() << std::endl;

    std::vector<int> vec3;
    vec3.reserve(TEN);
    for (int i = 0; i < TEN; i++)
    {
        vec3.push_back(i);
        std::cout << vec3.capacity() << std::endl;
    }
}

// 集合set
void SetTest()
{
    set<int> set1;
    set1.insert(ONE);
    set1.insert(TWO);
    set1.insert(THREE);

    set<int> set2(set1.begin(), set1.end());
    auto a = set2.find(TWO);
    set2.erase(a);

    set<int> set3(set1);
    std::cout << set3.count(THREE) << endl;
    set1.clear();
}

// map
void MapTest()
{
    std::map<int, std::string> map1 = {{1, "one"}, {2, "two"}, {3, "three"}};
    std::string value1 = map1[1];
    if (map1.find(1) != map1.end()) {
        std::cout << map1[3] << endl;
    }
    for (std::map<int, std::string>::iterator it = map1.begin(); it != map1.end(); it++) {
        std::cout << it->second << std::endl;
    }

    std::map<std::string, int> map2;
    map2["Alice"] = THIRTY;
    map2["Bob"] = TWENTY_FIVE;
    map2["Charlie"] = THIRTY_FIVE;
}

// 哈希表
int UnorderedMapTest()
{
    std::unordered_map<std::string, int> myMap;
    myMap["apple"] = TEN;
    myMap.insert(std::make_pair("banana", TWENTY));
    std::cout << myMap["apple"] << std::endl;
    std::cout << myMap.at("banana") << std::endl;

    if (myMap.find("orange") != myMap.end()) {}
    myMap.erase("apple");
    return 0;
}

// queue
int QueueTest()
{
    std::queue<int> q;
    q.push(TEN);
    q.push(TWENTY);
    q.push(THIRTY);
    if (q.empty()) {
        std::cout << "empty" << std::endl;
    }
    std::vector<int> v;
    while (!q.empty()) {
        v.push_back(q.front());
        q.pop();
    }
    q.pop();
    std::cout << q.front() << std::endl;
    return 0;
}

// deque
int DequeTest() {
    deque<int> dq;
    dq.push_back(ONE);
    dq.push_front(TWO);
    cout<< dq.front();
    dq.pop_front();
    return 0;
}

// stack
int StackTest()
{
    std::stack<int> myStack;
    myStack.push(TEN);
    myStack.push(TWENTY);
    myStack.push(THIRTY);
    std::cout << myStack.top() << endl;
    myStack.pop();
    if (myStack.empty()) {
        std::cout << "Stack is empty" << std::endl;
    } else {
        std::cout << myStack.size() << endl;
    }
    return 0;
}

// List
int ListTest()
{
    std::list<int> list1(FIVE);
    std::list<int> list2(FIVE, TEN);
    std::list<int> list3 = {1, 2, 3, 4};
    std::list<int> list4;
    list4.push_back(TEN);
    list4.push_back(TWENTY);
    list4.push_back(THIRTY);
    std::cout << list4.front() << std::endl;
    list4.pop_back();
    return 0;
}