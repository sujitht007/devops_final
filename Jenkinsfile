pipeline {
    agent any

    environment {
        IMAGE_NAME = "sujitht007/microservice-app"
        IMAGE_TAG  = "latest"
        DOCKER_USER = credentials('dockerhub-pass') // your Jenkins credential ID
        DOCKER_PASS = credentials('dockerhub-pass') // same ID
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/your-username/your-repo.git' // replace with your repo
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell '''
                    $env:DOCKER_PASS | docker login -u $env:DOCKER_USER --password-stdin
                    docker build -t $env:IMAGE_NAME:$env:IMAGE_TAG .
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                powershell '''
                    $env:DOCKER_PASS | docker login -u $env:DOCKER_USER --password-stdin
                    docker push $env:IMAGE_NAME:$env:IMAGE_TAG
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}
