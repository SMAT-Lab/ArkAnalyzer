[**ArkAnalyzer**](../README.md)

***

[ArkAnalyzer](../globals.md) / Logger

# Class: Logger

Defined in: src/utils/logger.ts:34

## Constructors

### Constructor

> **new Logger**(): `ConsoleLogger`

#### Returns

`ConsoleLogger`

## Methods

### configure()

> `static` **configure**(`logFilePath`, `arkanalyzer_level`, `tool_level`, `use_console`): `void`

Defined in: src/utils/logger.ts:35

#### Parameters

##### logFilePath

`string`

##### arkanalyzer\_level

[`LOG_LEVEL`](../enumerations/LOG_LEVEL.md) = `LOG_LEVEL.ERROR`

##### tool\_level

[`LOG_LEVEL`](../enumerations/LOG_LEVEL.md) = `LOG_LEVEL.INFO`

##### use\_console

`boolean` = `false`

#### Returns

`void`

***

### getLogger()

> `static` **getLogger**(`log_type`, `tag`): `Logger`

Defined in: src/utils/logger.ts:90

#### Parameters

##### log\_type

[`LOG_MODULE_TYPE`](../enumerations/LOG_MODULE_TYPE.md)

##### tag

`string` = `'-'`

#### Returns

`Logger`
