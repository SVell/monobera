#! /bin/bash

# Ensure the SECRET_SUBMODULE_PAT environment variable is set
# If it is, update the submodule
if [ -n "$SECRET_SUBMODULE_PAT" ]; then
    # Name of the submodule to update
    SUBMODULE_NAME="secrets"

    AUTH_URL="https://$SECRET_SUBMODULE_PAT@github.com/berachain/internal-dapps-env.git"


    # Update the submodule URL using git commands
    git submodule set-url "$SUBMODULE_NAME" "$AUTH_URL"

    # Sync and update the submodule in the Git repository
    # This looks redundant, but it's a workaround for missing b-sdk submodule
    git submodule deinit --quiet -f packages/b-sdk
    git submodule update --quiet --init --recursive
fi

# if secrets folder exists, copy the static folder to the apps
if [ -d "secrets/static" ]; then
    mkdir -p apps/hub/public/internal-env
    cp -r secrets/static/* apps/hub/public/internal-env

    mkdir -p apps/honey/public/internal-env
    cp -r secrets/static/* apps/honey/public/internal-env

    mkdir -p apps/lend/public/internal-env
    cp -r secrets/static/* apps/lend/public/internal-env

    mkdir -p apps/perp/public/internal-env
    cp -r secrets/static/* apps/perp/public/internal-env
fi


# echo "The URL of the submodule '$SUBMODULE_NAME' has been updated to '$AUTH_URL'."

pnpm i 
pnpm setenv $1