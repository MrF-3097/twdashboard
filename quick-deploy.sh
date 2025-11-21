#!/bin/bash
echo "Pushing to GitHub..."
git push
if [ $? -eq 0 ]; then
    echo "Push successful! Now deploying to dev server..."
    sshpass -p 'towerimob2025' ssh -o StrictHostKeyChecking=no dev@185.92.192.127 << 'ENDSSH'
        cd /home/dev/twdashboard
        git stash
        git pull
        git stash pop || true
        npm install
        pm2 restart all
        echo "Deployment complete!"
ENDSSH
else
    echo "Git push failed. Please check credentials."
fi
