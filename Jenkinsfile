pipeline {
    agent any

    environment {
        IMAGE_NAME = "sujitht007/microservice-app"
        IMAGE_TAG  = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
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
                withCredentials([usernamePassword(credentialsId: 'dockerhub-pass', 
                                                  usernameVariable: 'DOCKER_USER', 
                                                  passwordVariable: 'DOCKER_PASS')]) {
                    powershell """
                        docker login -u \$env:DOCKER_USER -p \$env:DOCKER_PASS
                        docker build -t \$env:IMAGE_NAME:\$env:IMAGE_TAG .
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
