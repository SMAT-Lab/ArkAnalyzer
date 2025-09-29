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

#include <string>
#include <memory>

using namespace std;

#define TWO 2
#define FOURTYTWO 42
#define HUNDRED 100

class MyClass {
public:
    explicit MyClass(int val) : data(val) {}
    ~MyClass() {}
    int GetData() { return this->data; }

private:
    int data;
};

struct MyStruct {
    int id;
    std::string name;
    char *size;
};

// 1.Ordinary pointer type declaration
void PtrType(int *p, int **pp)
{
    int *q = p;
    MyClass *clsPtr = new MyClass(TWO);
}

// 2. Basic pointer operations
void BasePtrOp(MyStruct *s, MyStruct s1)
{
    int x = 1;
    int *p = &x;
    int y = *p;
    *p = TWO;
    p = p + 1;
    s->id = 0;
    s->name = "example";
    int id = s1.id;
}

// 3.Multi-level pointer operations
void MultiLevelPtrOp(int *p, int **pp, int ***ppp)
{
    int x = 1;
    int y = 2;
    int **qq = pp;
    **pp = TWO;
    *qq = &x;
    ppp = &qq;
    **ppp = &y;
    *qq = **ppp;
    **(pp + 1) = TWO;
    MyStruct *s = new MyStruct();
    if (s != nullptr) {
        MyStruct **ss = &s;
        (*ss)->id = TWO;
        (**ss).name = "example";
        s->size = new char;
        *(s->size) = 'S';
        char size = *((*ss)->size);
    }
}

// arrays and pointers, functions and pointers, pointers and const, smart pointers(?)

void UniquePtrTest()
{
    unique_ptr<int> ptr1 = make_unique<int>(FOURTYTWO);
    unique_ptr<int> ptr2(new int(FOURTYTWO));
    *ptr1 = HUNDRED;
    int* rawPtr = ptr1.get();
}

void SharedPtrTest()
{
    shared_ptr<int> ptr1 = make_shared<int>(FOURTYTWO);
    shared_ptr<int> ptr2(new int(FOURTYTWO));
    *ptr1 = HUNDRED;
    int* rawPtr = ptr1.get();
}

class Node {
public:
    int data;
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> parent;

    Node(int value) : data(value) {}
};

void CircularReferenceExample()
{
    {
        auto node1 = std::make_shared<Node>(1);
        auto node2 = std::make_shared<Node>(2);

        node1->next = node2;
        node2->parent = node1;
    }
}