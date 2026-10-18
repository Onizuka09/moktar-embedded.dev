# The startup file

When an STM32 resets, the core reads two words from the start of flash: the **initial stack pointer** and the address of **Reset_Handler**. That is all the hardware does. Everything else is your code.

## The vector table

```c
extern unsigned int _estack;
void Reset_Handler(void);

__attribute__((section(".isr_vector")))
unsigned int *vector_table[] = {
    (unsigned int *)&_estack,
    (unsigned int *)Reset_Handler,
};
```

## Reset_Handler

It copies `.data` from flash to RAM, zeroes `.bss`, then calls `main()`.

| Section | Lives in | Initialised by |
|---------|----------|----------------|
| `.text` | flash | linker |
| `.data` | RAM (copied from flash) | Reset_Handler |
| `.bss`  | RAM | Reset_Handler |

To add a new post: save a `.md` file in `posts/` and add an entry to `data/posts.json`.
