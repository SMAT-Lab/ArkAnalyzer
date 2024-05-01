class Car {
    a: number
    
    @Type(() => Bus)
    b: Bus
}

class Bus {
}