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

class Dummy
{
public:
};
void log() {}

class Shape
{
public:
    virtual void draw(Dummy *d) = 0;
};

class Circle : public Shape
{
public:
    Dummy *obj;
    void draw(Dummy *d) override
    {
        log();
        this->obj = d;
    }
};
class Rectangle : public Shape
{
public:
    Dummy *obj;
    void draw(Dummy *d) override
    {
    }
};

Shape *id(Shape *t) { return t; }

int main()
{
    Dummy *d = new Dummy();
    Circle *c = new Circle();
    c->draw(d);
    Shape *b1 = id(c);
    b1->draw(d);
    return 0;
}