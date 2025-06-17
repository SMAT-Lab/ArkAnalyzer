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

// vector
void vectorTest()
{
    std::vector<int> vec1 = {1, 2, 3, 4, 5};
    int men = vec1[2];
    std::cout << "vec1[2]" << men << std::endl;
    vec1[2] = 6;
    std::cout << vec1[2] << std::endl;
    std::cout << vec1.back() << std::endl;

    std::vector<int> vec2;
    vec2.push_back(10);
    vec2.push_back(20);
    vec2.push_back(30);
    std::cout << "size is" << vec2.size() << "success" << std::endl;
    vec2.pop_back();
    std::cout << vec2.size() << std::endl;

    std::vector<int> vec3;
    vec3.reserve(10);
    for (int i = 0; i < 10; i++)
    {
        vec3.push_back(i);
        std::cout << vec3.capacity() << std::endl;
    }
}

// 集合set
void setTest()
{
    set<int> set1;
    set1.insert(1);
    set1.insert(2);
    set1.insert(3);

    set<int> set2(set1.begin(), set1.end());
    auto a = set2.find(2);
    set2.erase(a);

    set<int> set3(set1);
    std::cout << set3.count(3) << endl;
    set1.clear();
}

// map
void mapTest()
{
    std::map<int, std::string> map1 = {{1, "one"}, {2, "two"}, {3, "three"}};
    std::string value1 = map1[1];
    if (map1.find(1) != map1.end())
    {
        std::cout << map1[3] << endl;
    }
    for (std::map<int, std::string>::iterator it = map1.begin(); it != map1.end(); it++)
    {
        std::cout << it->second << std::endl;
    }

    std::map<std::string, int> map2;
    map2["Alice"] = 30;
    map2["Bob"] = 25;
    map2["Charlie"] = 35;
}

// 哈希表
int unorderedMapTest()
{
    std::unordered_map<std::string, int> myMap;
    myMap["apple"] = 10;
    myMap.insert(std::make_pair("banana", 20));
    std::cout << myMap["apple"] << std::endl;
    std::cout << myMap.at("banana") << std::endl;

    if (myMap.find("orange") != myMap.end())
    {
    }
    myMap.erase("apple");
    return 0;
}

// queue
int queueTest()
{
    std::queue<int> q;
    q.push(10);
    q.push(20);
    q.push(30);
    if (q.empty())
    {
        std::cout << "empty" << std::endl;
    }
    std::vector<int> v;
    while (!q.empty())
    {
        v.push_back(q.front());
        q.pop();
    }
    q.pop();
    std::cout << q.front() << std::endl;
    return 0;
}

// deque
int dequeTest() {
    deque<int> dq;
    dq.push_back(1);
    dq.push_front(2);
    cout<< dq.front();
    dq.pop_front();
    return 0;
}

// stack
int stackTest()
{
    std::stack<int> myStack;
    myStack.push(10);
    myStack.push(20);
    myStack.push(30);
    std::cout << myStack.top() << endl;
    myStack.pop();
    if (myStack.empty())
    {
        std::cout << "Stack is empty" << std::endl;
    }
    else
    {
        std::cout << myStack.size() << endl;
    }
    return 0;
}

// List
int listTest()
{
    std::list<int> list1(5);
    std::list<int> list2(5, 10);
    std::list<int> list3 = {1, 2, 3, 4};
    std::list<int> list4;
    list4.push_back(10);
    list4.push_back(20);
    list4.push_back(30);
    std::cout << list4.front() << std::endl;
    list4.pop_back();
    return 0;
}