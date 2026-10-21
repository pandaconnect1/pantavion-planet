# Dedicated private Pantavion inference server, no SaaS inference API calls.
# GGUF weights are provisioned into the private persistent disk at runtime.
# Never copy models or API keys into source control or the container image.
FROM ghcr.io/ggml-org/llama.cpp:server

ENV LLAMA_ARG_HOST=0.0.0.0 \
    LLAMA_ARG_PORT=10000 \
    LLAMA_ARG_MODEL=/models/pantavion.gguf \
    LLAMA_ARG_ALIAS=pantavion-local \
    LLAMA_ARG_CTX_SIZE=4096 \
    LLAMA_ARG_N_PARALLEL=1

# LLAMA_API_KEY is supplied separately via Render's private service secrets.
# Do not enable llama.cpp tool execution or expose the inference server publicly.
