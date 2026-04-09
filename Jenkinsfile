pipeline {
    agent any

    environment {
        IMAGE_NAME = "sujitht007/microservice-app"
        IMAGE_TAG  = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout the main branch
                git branch: 'main', url: 'https://github.com/sujitht007/devops_final.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                // Use Jenkins credentials for Docker login
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-pass', 
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS')]) {

                    powershell """
                        # Login to Docker Hub using PAT
                        echo \$env:DOCKER_PASS | docker login -u \$env:DOCKER_USER --password-stdin
                        
                        # Build Docker image
                        docker build -t \$env:IMAGE_NAME:\$env:IMAGE_TAG .

                        # Push Docker image
                        docker push \$env:IMAGE_NAME:\$env:IMAGE_TAG
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}
