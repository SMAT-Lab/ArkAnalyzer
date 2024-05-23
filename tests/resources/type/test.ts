export class ParticleParameterValue {
    /**
     * ParticleParameterValue of a particle parameter.
     */
    constructor(value: ParticleParameterValue);
    constructor(value: number, options: ParticleParameterOptions, name: string);
    constructor(...args: any[]) {
        if (args[0] instanceof ParticleParameterValue) {
            this.Copy(args[0]);
        }
        else {
            this.value = args[0];
            this.options = args[1];
            this.name = args[2];
        }
    }
}